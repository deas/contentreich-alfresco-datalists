package de.contentreich.alfresco.repo.datalist;

import org.alfresco.repo.processor.BaseProcessorExtension;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;

/**
 * @author Jan Pfitzner
 *
 */
public class DatalistIDServiceScriptFacade extends BaseProcessorExtension {
	
	private DatalistIDService datalistIDService;
	private NodeService nodeService;
	
	public void setNextId(NodeRef listItem){
		datalistIDService.setNextId(nodeService.getPrimaryParent(listItem)); 
	}
	
	public void setDatalistIDService(DatalistIDService datalistIDService) {
		this.datalistIDService = datalistIDService;
	}

	public void setNodeService(NodeService nodeService) {
		this.nodeService = nodeService;
	}
}
