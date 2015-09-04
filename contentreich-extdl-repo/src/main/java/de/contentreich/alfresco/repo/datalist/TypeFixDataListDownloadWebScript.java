package de.contentreich.alfresco.repo.datalist;

import org.alfresco.model.ContentModel;
import org.alfresco.model.DataListModel;
import org.alfresco.repo.web.scripts.DeclarativeSpreadsheetWebScript;
import org.alfresco.service.cmr.dictionary.PropertyDefinition;
import org.alfresco.service.cmr.dictionary.TypeDefinition;
import org.alfresco.service.cmr.repository.AssociationRef;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.site.SiteInfo;
import org.alfresco.service.cmr.site.SiteService;
import org.alfresco.service.namespace.InvalidQNameException;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.namespace.QName;
import org.alfresco.util.Pair;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptException;
import org.springframework.extensions.webscripts.WebScriptRequest;

import java.io.IOException;
import java.io.Serializable;
import java.util.*;

/**
 * Created by deas on 7/2/15.
 */
public class TypeFixDataListDownloadWebScript extends DeclarativeSpreadsheetWebScript
        implements InitializingBean
{
    // Logger
    private static final Log logger = LogFactory.getLog(TypeFixDataListDownloadWebScript.class);

    private static final QName DATA_LIST_ITEM_TYPE = DataListModel.PROP_DATALIST_ITEM_TYPE;

    private NodeService nodeService;
    private SiteService siteService;
    private NamespaceService namespaceService;
    private Map<QName,List<QName>> modelOrder;
    private Map<String,String> rawModelOrder;

    public TypeFixDataListDownloadWebScript()
    {
        this.filenameBase = "DataListExport";
    }

    public void setNodeService(NodeService nodeService)
    {
        this.nodeService = nodeService;
    }

    public void setSiteService(SiteService siteService)
    {
        this.siteService = siteService;
    }

    public void setNamespaceService(NamespaceService namespaceService)
    {
        this.namespaceService = namespaceService;
    }

    public void setModelOrder(Map<String,String> rawModelOrder)
    {
        this.rawModelOrder = rawModelOrder;
    }


    @Override
    public void afterPropertiesSet() throws Exception {
        modelOrder = new HashMap<QName, List<QName>>();
        for(String key : rawModelOrder.keySet())
        {
            QName model;
            List<QName> order = new ArrayList<QName>();

            try
            {
                model= QName.createQName(key, namespaceService);
            }
            catch(InvalidQNameException e)
            {
                logger.warn("Skipping invalid model type " + key);
                continue;
            }

            StringTokenizer st = new StringTokenizer(rawModelOrder.get(key), ",");
            while(st.hasMoreTokens())
            {
                order.add( QName.createQName(st.nextToken(), namespaceService) );
            }
            modelOrder.put(model, order);
        }
    }

    /**
     * Identify the datalist
     */
    @Override
    protected Object identifyResource(String format, WebScriptRequest req) {
        // Try to find the datalist they requested
        NodeRef list;
        Map<String,String> args = req.getServiceMatch().getTemplateVars();
        if(args.get("store_type") != null)
        {
            list = new NodeRef(
                    args.get("store_type"),
                    args.get("store_id"),
                    args.get("id")
            );
        }
        else
        {
            // Get the site
            SiteInfo site = siteService.getSite(args.get("site"));
            if(site == null)
            {
                throw new WebScriptException(Status.STATUS_NOT_FOUND, "Site not found with supplied name");
            }

            // Now find the data list container with in
            NodeRef container = nodeService.getChildByName(
                    site.getNodeRef(),
                    ContentModel.ASSOC_CONTAINS,
                    args.get("container")
            );
            if(container == null)
            {
                throw new WebScriptException(Status.STATUS_NOT_FOUND, "Container not found within site");
            }

            // Now get the data list itself
            list = nodeService.getChildByName(
                    container,
                    ContentModel.ASSOC_CONTAINS,
                    args.get("list")
            );
        }
        if(list == null || !nodeService.exists(list))
        {
            throw new WebScriptException(Status.STATUS_NOT_FOUND, "The Data List could not be found");
        }

        return list;
    }

    /**
     * We don't have a HTML version
     */
    @Override
    protected boolean allowHtmlFallback() {
        return false;
    }

    /**
     * Fetch the properties, in the requested order, from
     *  the data list definition
     */
    @Override
    protected List<Pair<QName, Boolean>> buildPropertiesForHeader(
            Object resource, String format, WebScriptRequest req) {
        NodeRef list = (NodeRef)resource;
        QName type = buildType(list);

        // Has the user given us rules for what to do
        //  with this type?
        List<QName> props;
        if(modelOrder.containsKey(type))
        {
            props = modelOrder.get(type);
        }
        else
        {
            // We'll have to try to guess it for them
            // For now, just use DataList properties for the type
            TypeDefinition typeDef = dictionaryService.getType(type);
            Map<QName, PropertyDefinition> allProps = typeDef.getProperties();
            props = new ArrayList<QName>();

            for(QName prop : allProps.keySet())
            {
                if(NamespaceService.DATALIST_MODEL_1_0_URI.equals(prop.getNamespaceURI()))
                {
                    props.add(prop);
                }
            }
        }

        // Everything is required
        List<Pair<QName, Boolean>> properties = new ArrayList<Pair<QName,Boolean>>();
        for(QName qname : props)
        {
            properties.add(new Pair<QName, Boolean>(qname, true));
        }
        return properties;
    }

    /* Fix is here */
    private QName buildType(NodeRef list)
    {
        return QName.createQName((String) nodeService.getProperty(list, DATA_LIST_ITEM_TYPE), this.namespaceService);
    }

    private List<NodeRef> getItems(NodeRef list)
    {
        Set<QName> typeSet = new HashSet<QName>(Arrays.asList(new QName[] { buildType(list) }));

        List<NodeRef> items = new ArrayList<NodeRef>();
        for(ChildAssociationRef ca : nodeService.getChildAssocs(list, typeSet))
        {
            items.add(ca.getChildRef());
        }
        return items;
    }

    @Override
    protected void populateBody(Object resource, CSVPrinter csv,
                                List<QName> properties) throws IOException {
        throw new WebScriptException(Status.STATUS_BAD_REQUEST, "CSV not currently supported");
    }

    @Override
    protected void populateBody(Object resource, Workbook workbook,
                                Sheet sheet, List<QName> properties) throws IOException {
        NodeRef list = (NodeRef)resource;
        List<NodeRef> items = getItems(list);

        // Our various formats
        DataFormat formatter = workbook.createDataFormat();
        String listJoiner = ",";
        CellStyle styleInt = workbook.createCellStyle();
        styleInt.setDataFormat( formatter.getFormat("0") );
        CellStyle styleDate = workbook.createCellStyle();
        styleDate.setDataFormat( formatter.getFormat("yyyy-mm-dd") );
        CellStyle styleDouble = workbook.createCellStyle();
        styleDouble.setDataFormat( formatter.getFormat("General") );
        CellStyle styleNewLines = workbook.createCellStyle();
        styleNewLines.setWrapText(true);

        // Export the items
        int rowNum = 1, colNum = 0;
        for(NodeRef item : items)
        {
            Row r = sheet.createRow(rowNum);

            colNum = 0;
            for(QName prop : properties)
            {
                Cell c = r.createCell(colNum);

                Serializable val = nodeService.getProperty(item, prop);
                if(val == null)
                {
                    // Is it an association, or just missing?
                    List<AssociationRef> assocs =  nodeService.getTargetAssocs(item, prop);
                    if(assocs.size() > 0)
                    {
                        StringBuffer text = new StringBuffer();
                        int lines = 1;

                        for(AssociationRef ref : assocs)
                        {
                            NodeRef child = ref.getTargetRef();
                            QName type = nodeService.getType(child);
                            if(ContentModel.TYPE_PERSON.equals(type))
                            {
                                if(text.length() > 0) {
                                    text.append('\n');
                                    lines++;
                                }
                                text.append(nodeService.getProperty(
                                        child, ContentModel.PROP_USERNAME
                                ));
                            }
                            else if(ContentModel.TYPE_CONTENT.equals(type))
                            {
                                // TODO Link to the content
                                if(text.length() > 0) {
                                    text.append('\n');
                                    lines++;
                                }
                                text.append(nodeService.getProperty(
                                        child, ContentModel.PROP_TITLE
                                ));
                            }
                            else
                            {
                                logger.warn("TODO: handle " + type + " for " + child);
                            }
                        }

                        String v = text.toString();
                        c.setCellValue( v );
                        if(lines > 1)
                        {
                            c.setCellStyle(styleNewLines);
                            r.setHeightInPoints( lines*sheet.getDefaultRowHeightInPoints() );
                        }
                    }
                    else
                    {
                        // This property isn't set
                        c.setCellType(Cell.CELL_TYPE_BLANK);
                    }
                }
                else
                {
                    // Regular property, set
                    if(val instanceof String)
                    {
                        c.setCellValue((String)val);
                    }
                    else if(val instanceof Date)
                    {
                        c.setCellValue((Date)val);
                        c.setCellStyle(styleDate);
                    }
                    else if(val instanceof Integer || val instanceof Long)
                    {
                        double v = 0.0;
                        if(val instanceof Long) v = (double)(Long)val;
                        if(val instanceof Integer) v = (double)(Integer)val;
                        c.setCellValue(v);
                        c.setCellStyle(styleInt);
                    }
                    else if(val instanceof Float || val instanceof Double)
                    {
                        double v = 0.0;
                        if(val instanceof Float) v = (double)(Float)val;
                        if(val instanceof Double) v = (double)(Double)val;
                        c.setCellValue(v);
                        c.setCellStyle(styleDouble);
                    }
                    else if (val instanceof List) {
                        c.setCellValue(StringUtils.join((List) val, listJoiner));
                    } else
                    {
                        // TODO
                        logger.warn("TODO: handle " + val.getClass().getName() + " - " + val);
                    }
                }

                colNum++;
            }

            rowNum++;
        }

        // Sensible column widths please!
        colNum = 0;
        for(QName prop : properties)
        {
            sheet.autoSizeColumn(colNum);
            colNum++;
        }
    }
}
