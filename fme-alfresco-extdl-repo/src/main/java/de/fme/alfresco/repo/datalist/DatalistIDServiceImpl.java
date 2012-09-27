package de.fme.alfresco.repo.datalist;

import org.alfresco.model.ContentModel;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;

public class DatalistIDServiceImpl implements DatalistIDService {

	private NodeService nodeService;

	@Override
	public int getNextId(NodeRef datalist) {
		// increment the value and handle possibility that no value has been set yet
        int resultValue = 1;
        Integer value = (Integer)this.nodeService.getProperty(datalist, ContentModel.PROP_COUNTER);
        if (value != null)
        {
            resultValue = value.intValue() + 1;
        }
        this.nodeService.setProperty(datalist, ContentModel.PROP_COUNTER, resultValue);
        return resultValue;
	}
	
	@Override
	public void setNextId(ChildAssociationRef childAssocRef) {
		final int nextId = getNextId(childAssocRef.getParentRef());
		this.nodeService.setProperty(childAssocRef.getChildRef(), PROP_DATALISTITEM_ID, nextId);
		
	}
	
	public void setNodeService(NodeService nodeService) {
		this.nodeService = nodeService;
	}
}
