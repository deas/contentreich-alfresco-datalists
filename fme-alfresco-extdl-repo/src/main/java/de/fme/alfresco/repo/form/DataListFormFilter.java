package de.fme.alfresco.repo.form;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import org.alfresco.model.ContentModel;
import org.alfresco.model.ForumModel;
import org.alfresco.repo.forms.FieldDefinition;
import org.alfresco.repo.forms.Form;
import org.alfresco.repo.forms.FormData;
import org.alfresco.repo.forms.FormData.FieldData;
import org.alfresco.repo.forms.PropertyFieldDefinition;
import org.alfresco.repo.forms.processor.AbstractFilter;
import org.alfresco.repo.forms.processor.Filter;
import org.alfresco.repo.policy.BehaviourFilter;
import org.alfresco.service.cmr.dictionary.TypeDefinition;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.ContentService;
import org.alfresco.service.cmr.repository.ContentWriter;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.namespace.NamespacePrefixResolver;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.namespace.RegexQNamePattern;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

public class DataListFormFilter<ItemType, PersistType> extends AbstractFilter<ItemType, PersistType> implements
        Filter<ItemType, PersistType> {

    private static final Log LOGGER = LogFactory.getLog(DataListFormFilter.class);
    private static final String COMMENTS_TOPIC_NAME = "Comments";
    private static final String COMMENTS_LABEL = "datalist.datagrid.comments.header";
    
    private static final String DISCUSSABLE_FIELDNAME = "fm:discussable";
    private static final String DISCUSSABLE_FORMPROPNAME = "prop_fm_discussable";
    
    /* use this is datagrid forms to place the actions, not always at the end! 
     * */
    private static final String ACTIONS_FIELDNAME = "actions";
    
    private NodeService nodeService;
    private ContentService contentService;
    private BehaviourFilter behaviourFilter;
    private Set<QName> datalistTypes;
    private NamespacePrefixResolver namespacePrefixResolver;
    
	// Global properties 
	public Properties properties;
	
    @Override
    public void afterGenerate(ItemType item, List<String> fields, List<String> forcedFields, Form form,
            Map<String, Object> context) {

        if (item instanceof TypeDefinition)
        {
        	final TypeDefinition typeDef = (TypeDefinition) item;
        	boolean addedDiscussable = false;
        	boolean addedActions = false;
        	boolean shouldAddDiscussable = datalistTypes.contains(typeDef.getName());
        	ArrayList<FieldDefinition> fieldDefs = new ArrayList<FieldDefinition>(fields.size());
        	for (String fieldName : fields) {
        		if (DISCUSSABLE_FIELDNAME.equals(fieldName))
                {
        			if (shouldAddDiscussable) {
	                    final FieldDefinition discussableFieldDef = getDiscussableFieldDef();
	                    
	                    //form.addFieldDefinition(discussableFieldDef);
	                    fieldDefs.add(discussableFieldDef);
	                    addedDiscussable = true;
        			}
                    
                } else if (ACTIONS_FIELDNAME.equals(fieldName)) {
                    //form.addFieldDefinition(discussableFieldDef);
                    final FieldDefinition actionsFieldDef = new PropertyFieldDefinition(ACTIONS_FIELDNAME, "actions");
                    actionsFieldDef.setDataKeyName(ACTIONS_FIELDNAME);
                    actionsFieldDef.setProtectedField(true);
                    actionsFieldDef.setLabel(ACTIONS_FIELDNAME);
                    if (LOGGER.isDebugEnabled()) LOGGER.debug("... generating field definition " + actionsFieldDef);
                    fieldDefs.add(actionsFieldDef);
                    addedActions = true;
                } else { // regular fields
                	fieldDefs.add(getNamedFieldDef(fieldName, form));
                }
        	}
        	
        	
            if (shouldAddDiscussable && !addedDiscussable) {
            	final FieldDefinition discussableFieldDef = getDiscussableFieldDef();
                //form.addFieldDefinition(discussableFieldDef);
            	fieldDefs.add(discussableFieldDef);
                addedDiscussable = true;
            }
            

        	form.setFieldDefinitions(fieldDefs);
        }
    }
	private FieldDefinition getNamedFieldDef(final String name, Form form) {
		for (FieldDefinition def :form.getFieldDefinitions()) {
			if (name.equals(def.getName())) {
				return def;
			}
		}
		return null;
	}
	private FieldDefinition getDiscussableFieldDef() {
		final FieldDefinition discussableFieldDef = new PropertyFieldDefinition(DISCUSSABLE_FIELDNAME, "discussion");//was fm_dis....
		discussableFieldDef.setDataKeyName(DISCUSSABLE_FORMPROPNAME);
		discussableFieldDef.setProtectedField(true);
		discussableFieldDef.setLabel(properties.getProperty(COMMENTS_LABEL, "Comments")); //was hard-coded
		if (LOGGER.isDebugEnabled()) LOGGER.debug("... generating field definition " + discussableFieldDef);
		return discussableFieldDef;
	}

    @Override
    public void afterPersist(ItemType item, FormData data, PersistType persistedObject) {
    	if (LOGGER.isDebugEnabled()) LOGGER.debug("afterPersist");
        final NodeRef nodeRef;
        if (persistedObject instanceof NodeRef) {
            nodeRef = (NodeRef) persistedObject;
            
        }else{
            return;
        }
        
        Set<String> fieldNames = data.getFieldNames();
        for (String fieldName : fieldNames) {
            if (fieldName.equalsIgnoreCase("DISCUSSABLE_FIELDNAME")){
                FieldData newCommentData = data.getFieldData(fieldName);
                String comment = newCommentData.getValue().toString();
                if (StringUtils.isNotEmpty( comment)){
                if (LOGGER.isDebugEnabled()){
                    LOGGER.debug("fm:discussable field found with value: "+ comment);
                }
                NodeRef commentsFolder = getOrCreateCommentsFolder(nodeRef);
                String name = getUniqueChildName(commentsFolder, "comment");
                ChildAssociationRef createdNode = nodeService.createNode(commentsFolder, ContentModel.ASSOC_CONTAINS, QName.createQName(NamespaceService.CONTENT_MODEL_1_0_URI, QName.createValidLocalName(name)), ForumModel.TYPE_POST);
                ContentWriter writer = contentService.getWriter(createdNode.getChildRef(), ContentModel.PROP_CONTENT, true);
                writer.setMimetype("text/html");
                writer.putContent(comment);
                }
            }
        }

    }

    @Override
    public void beforeGenerate(ItemType item, List<String> fields, List<String> forcedFields, Form form,
            Map<String, Object> context) {
        if (item instanceof NodeRef){
            NodeRef nodeRef = (NodeRef) item;
            if (datalistTypes.contains(nodeService.getType(nodeRef)) && nodeRef.getStoreRef().equals(StoreRef.STORE_REF_WORKSPACE_SPACESSTORE)){
                final FieldDefinition discussableFieldDef = getDiscussableFieldDef();
                form.addFieldDefinition(discussableFieldDef);
                NodeRef commentsFolder = getCommentsFolder(nodeRef);
                int commentCount = 0;
                if (commentsFolder != null){
                    Set<QName> types = new HashSet<QName>(1, 1.0f);
                    types.add(ForumModel.TYPE_POST);
                    commentCount = nodeService.getChildAssocs(commentsFolder, types).size();
                }
                form.addData(DISCUSSABLE_FORMPROPNAME, commentCount);
                
            }

        }
    }


    @Override
    public void beforePersist(ItemType item, FormData data) {
  	  if (LOGGER.isDebugEnabled()) LOGGER.debug("beforePersist: " + item.toString());

  	  if (data.hasFieldData(ACTIONS_FIELDNAME)) {
  		data.removeFieldData(ACTIONS_FIELDNAME);
  	  }
    }

	public void setProperties(Properties properties) {
		this.properties = properties;
	}
    /**
     * @param nodeService the nodeService to set
     */
    public void setNodeService(NodeService nodeService) {
        this.nodeService = nodeService;
    }
    
    public void setBehaviourFilter(BehaviourFilter behaviourFilter)
    {
        this.behaviourFilter = behaviourFilter;
    }
    
    /**
     * @param contentService the contentService to set
     */
    public void setContentService(ContentService contentService) {
        this.contentService = contentService;
    }

    /**
     * @param datalistTypes the datalistTypes to set
     */
    public void setDatalistTypes(Set<String> datalistTypes) {
        this.datalistTypes = new HashSet<QName>(datalistTypes.size(),1.0f);
        for (String string : datalistTypes) {
            this.datalistTypes.add(QName.createQName(StringUtils.substringBefore(string, ":"), StringUtils.substringAfter(string, ":"), this.namespacePrefixResolver));
        }
    }

    /**
     * @param namespacePrefixResolver the namespacePrefixResolver to set
     */
    public void setNamespacePrefixResolver(NamespacePrefixResolver namespacePrefixResolver) {
        this.namespacePrefixResolver = namespacePrefixResolver;
    }

    protected NodeRef getOrCreateCommentsFolder(NodeRef nodeRef) {
        NodeRef commentsFolder = getCommentsFolder(nodeRef);
        if (commentsFolder == null){
            commentsFolder = createCommentsFolder(nodeRef);
        }
        return commentsFolder;
    }
    
    private NodeRef getCommentsFolder(NodeRef nodeRef) {
        NodeRef commentsFolder = null;
        
        Set<QName> types = new HashSet<QName>(1, 1.0f);
        types.add(ForumModel.TYPE_FORUM);
        List<ChildAssociationRef> childAssocs = nodeService.getChildAssocs(nodeRef, types);
        if (childAssocs.size() > 0){
            NodeRef discussionFolder = childAssocs.get(0).getChildRef();
            commentsFolder = nodeService.getChildByName(discussionFolder,ContentModel.ASSOC_CONTAINS, COMMENTS_TOPIC_NAME);
        }
        return commentsFolder;
    }
    
    private NodeRef createCommentsFolder(NodeRef nodeRef){
        NodeRef commentsFolder = null;
        
        // ALF-5240: turn off auditing round the discussion node creation to prevent
        // the source document from being modified by the first user leaving a comment
        behaviourFilter.disableBehaviour(nodeRef, ContentModel.ASPECT_AUDITABLE);
        
        try
        {
            nodeService.addAspect(nodeRef, QName.createQName(NamespaceService.FORUMS_MODEL_1_0_URI, "discussable"), null);
            List<ChildAssociationRef> assocs = nodeService.getChildAssocs(nodeRef, QName.createQName(NamespaceService.FORUMS_MODEL_1_0_URI, "discussion"), RegexQNamePattern.MATCH_ALL);
            if (assocs.size() != 0)
            {
                NodeRef forumFolder = assocs.get(0).getChildRef();
                
                Map<QName, Serializable> props = new HashMap<QName, Serializable>(1);
                props.put(ContentModel.PROP_NAME, COMMENTS_TOPIC_NAME);
                commentsFolder = nodeService.createNode(
                        forumFolder,
                        ContentModel.ASSOC_CONTAINS, 
                        QName.createQName(NamespaceService.CONTENT_MODEL_1_0_URI, COMMENTS_TOPIC_NAME), 
                        QName.createQName(NamespaceService.FORUMS_MODEL_1_0_URI, "topic"),
                        props).getChildRef();
            }
        }
        finally
        {
            behaviourFilter.enableBehaviour(nodeRef, ContentModel.ASPECT_AUDITABLE);
        }
        
        return commentsFolder;
    }
    
    private String getUniqueChildName(NodeRef parentRef, String prefix){       
        String name = prefix + "-" + System.currentTimeMillis();

        // check that no child for the given name exists
        String finalName = name + "_" + Math.floor(Math.random() * 1000);
        int count = 0;
        while (nodeService.getChildByName(parentRef, ContentModel.ASSOC_CONTAINS, finalName) != null || count > 100)
        {
           finalName = name + "_" + Math.floor(Math.random() * 1000);
           ++count;
        }
        return finalName;
    }
}
