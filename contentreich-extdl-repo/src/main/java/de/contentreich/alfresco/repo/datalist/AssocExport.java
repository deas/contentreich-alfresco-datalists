package de.contentreich.alfresco.repo.datalist;

import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.namespace.QName;

import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.Set;

/**
 * Created by deas on 11/8/16.
 */
public class AssocExport {
    private Set<QName> properties;
    private String format;

    public void setProperties(Set<QName> properties) {
        this.properties = properties;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String export(NodeService nodeService, NodeRef nodeRef) {
        ArrayList args = new ArrayList();
        for (QName qname : properties) {
            args.add(nodeService.getProperty(nodeRef, qname));
        }
        return MessageFormat.format(format, args.toArray(new Object[args.size()]));
    }
}
