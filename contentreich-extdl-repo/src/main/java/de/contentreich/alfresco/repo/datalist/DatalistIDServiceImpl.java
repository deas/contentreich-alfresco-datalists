package de.contentreich.alfresco.repo.datalist;

import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;

public class DatalistIDServiceImpl /* extends BaseProcessorExtension */ implements DatalistIDService {
    private static final Logger logger = LoggerFactory.getLogger(DatalistIDServiceImpl.class);
    private NodeService nodeService;
    private String defaultFmt;

    public void setDefaultFmt(String defaultFmt) {
        this.defaultFmt = defaultFmt;
    }

    String getNextId(NodeRef datalist) {
        if (nodeService.hasAspect(datalist, ASPECT_AUTO_ID_LIST)) {
            nodeService.addAspect(datalist, ASPECT_AUTO_ID_LIST, Collections.EMPTY_MAP);
        }
        Integer currentId = (Integer) this.nodeService.getProperty(datalist, PROP_DATALIST_LASTID);
        String customFmt = (String) this.nodeService.getProperty(datalist, PROP_DATALIST_ID_FMT);
        String fmt = customFmt != null ? customFmt : this.defaultFmt;
        Integer nextId = currentId != null ? currentId + 1 : 1;
        String nextIds = String.format(fmt, nextId);
        this.nodeService.setProperty(datalist, PROP_DATALIST_LASTID, nextId);
        return nextIds;
    }

    @Override
    public void setNextId(ChildAssociationRef childAssocRef) {
        NodeRef listNodeRef = childAssocRef.getParentRef();
        NodeRef itemNodeRef = childAssocRef.getChildRef();
        String nextId = getNextId(listNodeRef);
        if (nodeService.hasAspect(itemNodeRef, ASPECT_AUTO_ID_ITEM)) {
            nodeService.addAspect(listNodeRef, ASPECT_AUTO_ID_ITEM, Collections.EMPTY_MAP);
        }
        // String is better on the item
        nodeService.setProperty(itemNodeRef, PROP_DATALISTITEM_ID, nextId.toString());
        logger.debug("Set id of {} to {}", itemNodeRef, nextId);
    }

    public void setNodeService(NodeService nodeService) {
        this.nodeService = nodeService;
    }
}
