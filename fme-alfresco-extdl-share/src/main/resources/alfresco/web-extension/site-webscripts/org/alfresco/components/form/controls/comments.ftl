<#include "common/editorparams.inc.ftl" />
<#if (context.properties.nodeRef?? && context.properties.nodeRef?js_string?starts_with("workspace://SpacesStore")) 
|| ((form.mode == "edit" || form.mode == "view") && args.itemId?? && args.itemId?js_string?starts_with("workspace://SpacesStore"))>

<div class="form-field">

    <#if form.mode == "edit">
    	<script type="text/javascript">//<![CDATA[
      (function()
      {
         new Alfresco.RichTextControl("${fieldHtmlId}").setOptions(
         {
            <#if form.mode == "view" || (field.disabled && !(field.control.params.forceEditable?? && field.control.params.forceEditable == "true"))>disabled: true,</#if>
            currentValue: "${field.value?js_string}",
            mandatory: ${field.mandatory?string},
            <@editorParameters field />
         }).setMessages(
            ${messages}
         );
      })();
      //]]></script>
    
    </#if>
		   <script type="text/javascript">//<![CDATA[
		   new Alfresco.CommentsControls("${fieldHtmlId}-list").setOptions(
		   {
		      height: ${args.editorHeight!180},
		      width: ${args.editorWidth!700},
		      <#if context.properties.nodeRef??>
		         	itemNodeRef: "${context.properties.nodeRef?js_string}"
		         <#elseif (form.mode == "edit" || form.mode == "view") && args.itemId??>
		         	itemNodeRef: "${args.itemId?js_string}"
		         <#else>
		         	itemNodeRef: ""
		         </#if>
		   }).setMessages(
		      ${messages}
		   );
		//]]></script>
		   
		   <label for="${fieldHtmlId}">${field.label?html}:<#if field.mandatory><span class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if></label>
		   
		    <#if form.mode == "edit">
		   		<textarea id="${fieldHtmlId}" name="${field.name}" rows="${rows}" columns="${columns}" tabindex="0"
                <#if field.description??>title="${field.description}"</#if>
                <#if field.control.params.styleClass??>class="${field.control.params.styleClass}"</#if>
                <#if field.control.params.style??>style="${field.control.params.style}"</#if>
                <#if field.disabled && !(field.control.params.forceEditable?? && field.control.params.forceEditable == "true")>disabled="true"</#if>>${field.value?html}</textarea>
		   </#if>
		   <div id="${fieldHtmlId}-list" class="comment-list" style="display:none;">
			   <div class="postlist-infobar">
			      <div id="${fieldHtmlId}-list-paginator" class="paginator"></div>
			   </div>
			   <div class="clear"></div>
			   <div id="${fieldHtmlId}-list-comments"></div>
			</div>
</div>
</#if> 