/**
 * 
 */
package de.contentreich.alfresco.repo.datalist;

import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.namespace.QName;

/**
 * @author Jan Pfitzner
 *
 */
public interface DatalistIDService {
	
	String XDL_NAMESPACE = "http://www.contentreich.de/model/xdatalist/1.0";
	QName ASPECT_AUTO_ID_LIST = QName.createQName(XDL_NAMESPACE, "autoidList");
	QName ASPECT_AUTO_ID_ITEM = QName.createQName(XDL_NAMESPACE, "autoIdItem");
	QName PROP_DATALISTITEM_ID = QName.createQName(XDL_NAMESPACE, "id");
	QName PROP_DATALIST_LASTID = QName.createQName(XDL_NAMESPACE, "lastId");
	QName PROP_DATALIST_ID_FMT = QName.createQName(XDL_NAMESPACE, "idFmt");

	void setNextId(ChildAssociationRef childAssocRef);
}
