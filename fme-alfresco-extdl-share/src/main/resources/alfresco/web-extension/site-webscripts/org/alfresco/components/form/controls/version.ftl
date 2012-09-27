<#if (context.properties.nodeRef?? && context.properties.nodeRef?js_string?starts_with("workspace://SpacesStore")) 
|| ((form.mode == "edit" || form.mode == "view") && args.itemId?? && args.itemId?js_string?starts_with("workspace://SpacesStore"))>

<#assign controlId = fieldHtmlId + "-cntrl">

<div class="form-field">
   
   <script type="text/javascript">//<![CDATA[
   (function()
   {
      new Alfresco.VersionControl("${controlId}").setOptions(
      {
         <#if context.properties.nodeRef??>
         	nodeRef: "${context.properties.nodeRef?js_string}"
         <#elseif (form.mode == "edit" || form.mode == "view") && args.itemId??>
         	nodeRef: "${args.itemId?js_string}"
         <#else>
         	nodeRef: ""
         </#if>
         }).setMessages(
         ${messages}
      );
   })();
   //]]></script>
   
   <label for="${controlId}">${field.label?html}:</label>
   
   
   <div id="${controlId}" style="width:24em">
   </div>
   
</div>
</#if>