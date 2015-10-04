/**
 * 
 */
package de.contentreich.alfresco.repo.datalist;

import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.namespace.QName;

/**
 * @author Jan Pfitzner
 *
 */
public interface DatalistIDService {
	
	public static final String DL_NAMESPACE = "http://www.alfresco.org/model/datalist/1.0";
	public static final QName PROP_DATALISTITEM_ID = QName.createQName(DL_NAMESPACE, "itemId");

	int getNextId(NodeRef datalist);

	void setNextId(ChildAssociationRef childAssocRef);
}
