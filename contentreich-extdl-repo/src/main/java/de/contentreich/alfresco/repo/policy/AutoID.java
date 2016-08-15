package de.contentreich.alfresco.repo.policy;

import de.contentreich.alfresco.repo.datalist.DatalistIDService;
import org.alfresco.repo.node.NodeServicePolicies.OnCreateNodePolicy;
import org.alfresco.repo.policy.Behaviour.NotificationFrequency;
import org.alfresco.repo.policy.JavaBehaviour;
import org.alfresco.repo.policy.PolicyComponent;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.namespace.QName;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AutoID implements OnCreateNodePolicy {
    private static final Logger logger = LoggerFactory.getLogger(AutoID.class);
    private QName type;

    private PolicyComponent policyComponent;
    private DatalistIDService datalistIDService;

    public void init() {
        logger.debug("Init with type {}", type);
        policyComponent.bindClassBehaviour(OnCreateNodePolicy.QNAME, type, new JavaBehaviour(this, OnCreateNodePolicy.QNAME.getLocalName(),
                NotificationFrequency.FIRST_EVENT));
    }

    @Override
    public void onCreateNode(ChildAssociationRef childAssocRef) {
        this.datalistIDService.setNextId(childAssocRef);
    }

    public void setType(QName type) {
        this.type = type;
    }

    public void setPolicyComponent(PolicyComponent policyComponent) {
        this.policyComponent = policyComponent;
    }

    public void setDatalistIDService(DatalistIDService datalistIDService) {
        this.datalistIDService = datalistIDService;
    }
}
