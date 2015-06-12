<#include "/org/alfresco/components/form/controls/common/picker.inc.ftl" />

<#assign controlId = fieldHtmlId + "-cntrl">
<#if field.control.params.allowNavigation??>
<#assign allowNavigation=field.control.params.allowNavigation == "true" />
<#else>
<#assign allowNavigation=true />
</#if>
<script type="text/javascript">//<![CDATA[
(function()
{

   <@renderPickerJS field "picker" />
   picker.setOptions(
   {
   <#if field.control.params.showTargetLink??>
      showLinkToTarget: ${field.control.params.showTargetLink},
      targetLinkTemplate: attachment_renderLinkTemplate,
   </#if>
   <#if field.control.params.allowNavigationToContentChildren??>
      allowNavigationToContentChildren: ${field.control.params.allowNavigationToContentChildren},
   </#if>
      itemType: "${field.endpointType}",
      multipleSelectMode: ${field.endpointMany?string},
      parentNodeRef: "alfresco://company/home",
      itemFamily: "node",
      displayMode: "${field.control.params.displayMode!"items"}"
   });

   new Alfresco.AttachmentControlMod("${controlId}-upload", "${fieldHtmlId}-upload").setOptions(
   {

   	  objectFinder: picker,

      allowNavigation: ${allowNavigation?string("true", "false")},
    <#if field.control.params.startLocation??>
      startLocation: "${field.control.params.startLocation}",
      <#if form.mode == "edit" && args.itemId??>currentItem: "${args.itemId?js_string}",</#if>
      <#if form.mode == "create" && form.destination?? && form.destination?length &gt; 0>currentItem: "${form.destination?js_string}",</#if>
   </#if>
   <#if field.control.params.startLocationParams??>
      startLocationParams: "${field.control.params.startLocationParams?js_string}",
   </#if>
   
   	
   }).setMessages(
      ${messages}
   );
})();

function attachment_renderLinkTemplate(item){
	if (item.type == "app:filelink"){
		return "${url.context}/page/site/" + Alfresco.constants.SITE + "/document-details?nodeRef=" + item.destination;
	}else if (item.type == "cm:folder"){
		return "${url.context}/page/site/" + Alfresco.constants.SITE + "/folder-details?nodeRef=" + item.nodeRef;
	}else{
		return "${url.context}/page/site/" + Alfresco.constants.SITE + "/document-details?nodeRef=" + item.nodeRef;
	}
}

//]]></script>

<div class="form-field">
   <#if form.mode == "view">
      <div id="${controlId}" class="viewmode-field">
         <#if (field.endpointMandatory!false || field.mandatory!false) && field.value == "">
            <span class="incomplete-warning"><img src="${url.context}/res/components/form/images/warning-16.png" title="${msg("form.field.incomplete")}" /><span>
         </#if>
         <span class="viewmode-label">${field.label?html}:</span>
         <span id="${controlId}-currentValueDisplay" class="viewmode-value current-values"></span>
      </div>
   <#else>
      <label for="${controlId}">${field.label?html}:<#if field.endpointMandatory!false || field.mandatory!false><span class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if></label>
      
      <div id="${controlId}" class="object-finder">
         
         <div id="${controlId}-currentValueDisplay" class="current-values"></div>
         
         <#if field.disabled == false>
            <input type="hidden" id="${fieldHtmlId}" name="-" value="${field.value?html}" />
            <input type="hidden" id="${controlId}-added" name="${field.name}_added" />
            <input type="hidden" id="${controlId}-removed" name="${field.name}_removed" />
            <div id="${controlId}-itemGroupActions" class="show-picker"><span id="${controlId}-upload"><button id="${controlId}-upload-button">${msg("form.control.attachments.upload")}</button></span></div>
            <div id="${controlId}-upload-destination-dialog"></div>
         
         
            <@renderPickerHTML controlId />

         </#if>
      </div>
   </#if>
</div>
