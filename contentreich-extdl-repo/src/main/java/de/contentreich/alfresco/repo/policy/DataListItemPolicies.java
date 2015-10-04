package de.contentreich.alfresco.repo.policy;

import java.io.Serializable;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import org.alfresco.model.ContentModel;
import org.alfresco.repo.node.MLPropertyInterceptor;
import org.alfresco.repo.node.NodeServicePolicies.OnCreateAssociationPolicy;
import org.alfresco.repo.node.NodeServicePolicies.OnCreateNodePolicy;
import org.alfresco.repo.node.NodeServicePolicies.OnDeleteAssociationPolicy;
import org.alfresco.repo.policy.Behaviour;
import org.alfresco.repo.policy.Behaviour.NotificationFrequency;
import org.alfresco.repo.policy.JavaBehaviour;
import org.alfresco.repo.policy.PolicyComponent;
import org.alfresco.repo.policy.PolicyScope;
import org.alfresco.repo.transaction.AlfrescoTransactionSupport;
import org.alfresco.repo.version.VersionServicePolicies.OnCreateVersionPolicy;
import org.alfresco.service.cmr.dictionary.AssociationDefinition;
import org.alfresco.service.cmr.dictionary.ClassDefinition;
import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.cmr.dictionary.PropertyDefinition;
import org.alfresco.service.cmr.repository.AssociationRef;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.version.VersionService;
import org.alfresco.service.cmr.version.VersionType;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.namespace.RegexQNamePattern;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import de.contentreich.alfresco.repo.datalist.DatalistIDService;

/**
 * 
 * OnCreateVersion Policy for dl:dataListItem. Takes care that always major
 * versions are created
 * 
 * @author Jan Pfitzner (fme AG)
 * 
 */
public class DataListItemPolicies implements OnCreateVersionPolicy, OnCreateAssociationPolicy, OnDeleteAssociationPolicy , OnCreateNodePolicy{
    public static final String NAMESPACE_DL_PREFIX = "dl";
    public static final String DL_NAMESPACE = "http://www.alfresco.org/model/datalist/1.0";
    public static final QName TYPE_DATA_LIST_ITEM = QName.createQName(DL_NAMESPACE, "dataListItem");
    public static final QName ASSOC_ASSIGNEE = QName.createQName(DL_NAMESPACE, "assignee");
    public static final QName ASSOC_TASK_ASSIGNEE = QName.createQName(DL_NAMESPACE, "taskAssignee");
    public static final QName ASSOC_ISSUED_ASSIGNED_TO = QName.createQName(DL_NAMESPACE, "issueAssignedTo");
    public static final QName ASSOC_DL_ATTACHMENTS = QName.createQName(DL_NAMESPACE, "attachments");
    
    public static final QName PROP_ASSIGNEE_FULLNAME = QName.createQName(DL_NAMESPACE, "assigneeFullName");

    public static final QName ASPECT_ASSIGNEE_HELPER = QName.createQName(DL_NAMESPACE, "assigneeHelper");
    
    //http://code.google.com/p/fme-alfresco-extensions/issues/detail?id=15	
    public static final QName ON_CREATE_VERSION_POLICY_QNAME = QName.createQName(NamespaceService.ALFRESCO_URI, "onCreateVersion");

    private Behaviour onCreateVersionBehaviour;
    private Behaviour onCreateAssociationBehaviour;
    private Behaviour onDeleteAssociationBehaviour;
    private Behaviour onCreateNodePolicy;
    
    private PolicyComponent policyComponent;
    private DictionaryService dictionaryService;
    private NodeService nodeService;
    private VersionService versionService;
    private DatalistIDService datalistIDService;


    private static Log logger = LogFactory.getLog(DataListItemPolicies.class);
    /** Transaction resource key */
    private static final String KEY_VERSIONED_NODEREFS = "versioned_noderefs";

    public void init() {
        
        this.onCreateVersionBehaviour = new JavaBehaviour(this, ON_CREATE_VERSION_POLICY_QNAME.getLocalName(),
                NotificationFrequency.FIRST_EVENT);
        policyComponent.bindClassBehaviour(ON_CREATE_VERSION_POLICY_QNAME, QName.createQName(
                "http://www.alfresco.org/model/datalist/1.0", "dataListItem"), this.onCreateVersionBehaviour);
        
        this.onCreateAssociationBehaviour = new JavaBehaviour(this, "onCreateAssociation",
                NotificationFrequency.FIRST_EVENT);
        policyComponent.bindAssociationBehaviour(OnCreateAssociationPolicy.QNAME, TYPE_DATA_LIST_ITEM,
                ASSOC_ASSIGNEE, this.onCreateAssociationBehaviour);
        policyComponent.bindAssociationBehaviour(OnCreateAssociationPolicy.QNAME, TYPE_DATA_LIST_ITEM,
                ASSOC_TASK_ASSIGNEE, this.onCreateAssociationBehaviour);
        policyComponent.bindAssociationBehaviour(OnCreateAssociationPolicy.QNAME, TYPE_DATA_LIST_ITEM,
                ASSOC_ISSUED_ASSIGNED_TO, this.onCreateAssociationBehaviour);
        policyComponent.bindAssociationBehaviour(OnCreateAssociationPolicy.QNAME, TYPE_DATA_LIST_ITEM,
                ContentModel.ASSOC_ATTACHMENTS, this.onCreateAssociationBehaviour);
        policyComponent.bindAssociationBehaviour(OnCreateAssociationPolicy.QNAME, TYPE_DATA_LIST_ITEM,
                ASSOC_DL_ATTACHMENTS, this.onCreateAssociationBehaviour);
        
        this.onDeleteAssociationBehaviour = new JavaBehaviour(this, "onDeleteAssociation",
                NotificationFrequency.FIRST_EVENT);
        policyComponent.bindAssociationBehaviour(OnDeleteAssociationPolicy.QNAME, TYPE_DATA_LIST_ITEM,
                ASSOC_ASSIGNEE, this.onDeleteAssociationBehaviour);
        policyComponent.bindAssociationBehaviour(OnDeleteAssociationPolicy.QNAME, TYPE_DATA_LIST_ITEM,
                ASSOC_TASK_ASSIGNEE, this.onDeleteAssociationBehaviour);
        policyComponent.bindAssociationBehaviour(OnDeleteAssociationPolicy.QNAME, TYPE_DATA_LIST_ITEM,
                ASSOC_ISSUED_ASSIGNED_TO, this.onDeleteAssociationBehaviour);
        policyComponent.bindAssociationBehaviour(OnDeleteAssociationPolicy.QNAME, TYPE_DATA_LIST_ITEM,
                ContentModel.ASSOC_ATTACHMENTS, this.onDeleteAssociationBehaviour);
        policyComponent.bindAssociationBehaviour(OnDeleteAssociationPolicy.QNAME, TYPE_DATA_LIST_ITEM,
                ASSOC_DL_ATTACHMENTS, this.onDeleteAssociationBehaviour);
        
        this.onCreateNodePolicy = new JavaBehaviour(this, OnCreateNodePolicy.QNAME.getLocalName(),
                NotificationFrequency.FIRST_EVENT);
        policyComponent.bindClassBehaviour(OnCreateNodePolicy.QNAME, QName.createQName(
                "http://www.alfresco.org/model/datalist/1.0", "dataListItem"), this.onCreateNodePolicy);
    }
    
    @Override
    public void onCreateNode(ChildAssociationRef childAssocRef) {
        this.datalistIDService.setNextId(childAssocRef);
        //set cm:autoVersionOnUpdateProps=true
        this.nodeService.setProperty(childAssocRef.getChildRef(), ContentModel.PROP_AUTO_VERSION_PROPS, true);
    }

    @Override
    public void onCreateVersion(QName classRef, NodeRef versionableNode, Map<String, Serializable> versionProperties,
            PolicyScope nodeDetails) {
        logger.debug("create version");
        versionProperties.put("versionType", VersionType.MAJOR);
        defaultOnCreateVersion(classRef, versionableNode, versionProperties, nodeDetails);
        // version cm:attachable props & assocs
        if (nodeService.hasAspect(versionableNode, ContentModel.ASPECT_ATTACHABLE)) {
            List<AssociationRef> nodeAssocRefs = this.nodeService.getTargetAssocs(versionableNode,
                    RegexQNamePattern.MATCH_ALL);
            for (AssociationRef nodeAssocRef : nodeAssocRefs) {
                if (nodeAssocRef.getTypeQName().equals(ContentModel.ASSOC_ATTACHMENTS)) {
                    nodeDetails.addAssociation(classRef, nodeAssocRef);
                }
            }
        }
    }
    
    @Override
    public void onCreateAssociation(AssociationRef nodeAssocRef) {
        NodeRef nodeRef = nodeAssocRef.getSourceRef();
        if (this.nodeService.exists(nodeRef) == true){
            this.onCreateAssociationBehaviour.disable();
            try{
                addAssigneeFullNames(nodeAssocRef);
                createVersionImpl(nodeRef);
            }finally{
                this.onCreateAssociationBehaviour.enable();
            }
           
        }
        
        
    }

    @Override
    public void onDeleteAssociation(AssociationRef nodeAssocRef) {
        NodeRef nodeRef = nodeAssocRef.getSourceRef();
        if (this.nodeService.exists(nodeRef) == true){
            this.onDeleteAssociationBehaviour.disable();
            try{
                deleteAssigneeFullNames(nodeAssocRef);
                createVersionImpl(nodeRef);
            }finally{
                this.onDeleteAssociationBehaviour.enable();
            }
        }
    }
    
    @SuppressWarnings("unchecked")
    private void addAssigneeFullNames(AssociationRef nodeAssocRef) {
        NodeRef nodeRef = nodeAssocRef.getSourceRef();
        NodeRef personRef = nodeAssocRef.getTargetRef();
        String firstName = (String) nodeService.getProperty(personRef, ContentModel.PROP_FIRSTNAME);
        String lastName = (String) nodeService.getProperty(personRef, ContentModel.PROP_LASTNAME);
        String fullName = (firstName == null ? "": firstName) + (lastName == null ? "": lastName);
        Map<QName, Serializable> fullNames = new HashMap<QName, Serializable>();
        Collection<String> allNames = new HashSet<String>();
        if (!nodeService.hasAspect(nodeRef, ASPECT_ASSIGNEE_HELPER)){
            allNames.add(fullName);
            fullNames.put(PROP_ASSIGNEE_FULLNAME, (Serializable) allNames);
            nodeService.addAspect(nodeRef, ASPECT_ASSIGNEE_HELPER, fullNames);
        }else{
            allNames = (Collection<String>) nodeService.getProperty(nodeRef, PROP_ASSIGNEE_FULLNAME);
            allNames.add(fullName);
            nodeService.setProperty(nodeRef, PROP_ASSIGNEE_FULLNAME,(Serializable) allNames);
        }
        
    }
    
    @SuppressWarnings("unchecked")
    private void deleteAssigneeFullNames(AssociationRef nodeAssocRef) {
        NodeRef nodeRef = nodeAssocRef.getSourceRef();
        NodeRef personRef = nodeAssocRef.getTargetRef();
        String firstName = (String) nodeService.getProperty(personRef, ContentModel.PROP_FIRSTNAME);
        String lastName = (String) nodeService.getProperty(personRef, ContentModel.PROP_LASTNAME);
        String fullName = (firstName == null ? "": firstName) +" "+ (lastName == null ? "": lastName);
        Collection<String> allNames = new HashSet<String>();
        if (nodeService.hasAspect(nodeRef, ASPECT_ASSIGNEE_HELPER)){
            allNames = (Collection<String>) nodeService.getProperty(nodeRef, PROP_ASSIGNEE_FULLNAME);
            allNames.remove(fullName);
            nodeService.setProperty(nodeRef, PROP_ASSIGNEE_FULLNAME,(Serializable) allNames);
        }
        
    }

    /**
     * @param policyComponent
     *            the policyComponent to set
     */
    public void setPolicyComponent(PolicyComponent policyComponent) {
        this.policyComponent = policyComponent;
    }

    /**
     * @param dictionaryService
     *            the dictionaryService to set
     */
    public void setDictionaryService(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    /**
     * @param nodeService
     *            the nodeService to set
     */
    public void setNodeService(NodeService nodeService) {
        this.nodeService = nodeService;
    }

    /**
     * @param versionService the versionService to set
     */
    public void setVersionService(VersionService versionService) {
        this.versionService = versionService;
    }
    
    /**
     * 
     * @param datalistIDService the datalistIDService to set
     */
    public void setDatalistIDService(DatalistIDService datalistIDService) {
		this.datalistIDService = datalistIDService;
	}

    protected void defaultOnCreateVersion(QName classRef, NodeRef nodeRef, Map<String, Serializable> versionProperties,
            PolicyScope nodeDetails) {
        ClassDefinition classDefinition = this.dictionaryService.getClass(classRef);
        if (classDefinition != null) {
            boolean wasMLAware = MLPropertyInterceptor.setMLAware(true);
            try {
                // Copy the properties
                Map<QName, PropertyDefinition> propertyDefinitions = classDefinition.getProperties();
                for (QName propertyName : propertyDefinitions.keySet()) {
                    Serializable propValue = this.nodeService.getProperty(nodeRef, propertyName);
                    nodeDetails.addProperty(classRef, propertyName, propValue);
                }
            } finally {
                MLPropertyInterceptor.setMLAware(wasMLAware);
            }

            // Version the associations (child and target)
            Map<QName, AssociationDefinition> assocDefs = classDefinition.getAssociations();

            if (classDefinition.isContainer()) {
                List<ChildAssociationRef> childAssocRefs = this.nodeService.getChildAssocs(nodeRef);
                for (ChildAssociationRef childAssocRef : childAssocRefs) {
                    if (assocDefs.containsKey(childAssocRef.getTypeQName())) {
                        nodeDetails.addChildAssociation(classDefinition.getName(), childAssocRef);
                    }
                }
            }

            List<AssociationRef> nodeAssocRefs = this.nodeService.getTargetAssocs(nodeRef, RegexQNamePattern.MATCH_ALL);
            for (AssociationRef nodeAssocRef : nodeAssocRefs) {
                if (assocDefs.containsKey(nodeAssocRef.getTypeQName())) {
                    nodeDetails.addAssociation(classDefinition.getName(), nodeAssocRef);
                }
            }
        }
    }
    
    private void createVersionImpl(NodeRef nodeRef) {
        @SuppressWarnings("unchecked")
        Map<NodeRef, NodeRef> versionedNodeRefs = (Map<NodeRef, NodeRef>) AlfrescoTransactionSupport.getResource(KEY_VERSIONED_NODEREFS);
        if (versionedNodeRefs == null || versionedNodeRefs.containsKey(nodeRef) == false)
        {
            recordCreateVersion(nodeRef);
            this.versionService.createVersion(nodeRef, null);
        }
    }
    
    @SuppressWarnings("unchecked")
    private void recordCreateVersion(NodeRef versionableNode) 
    {
        Map<NodeRef, NodeRef> versionedNodeRefs = (Map<NodeRef, NodeRef>)AlfrescoTransactionSupport.getResource(KEY_VERSIONED_NODEREFS);
        if (versionedNodeRefs == null)
        {
            versionedNodeRefs = new HashMap<NodeRef, NodeRef>();
            AlfrescoTransactionSupport.bindResource(KEY_VERSIONED_NODEREFS, versionedNodeRefs);
        }
        versionedNodeRefs.put(versionableNode, versionableNode);
    }
}
