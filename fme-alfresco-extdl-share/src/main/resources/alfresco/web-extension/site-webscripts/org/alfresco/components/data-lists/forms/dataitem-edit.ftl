
<#if error?exists>
   <div class="error">${error}</div>
<#elseif form?exists>

   <#assign id=args.htmlid>
	<#if formUI == "true">
	   <@formLib.renderFormsRuntime formId=formId />
	</#if>
   
   <div id="${formId}-container" class="form-container columns-form-container">
      <#if form.showCaption?exists && form.showCaption>
         <div id="${formId}-caption" class="caption"><span class="mandatory-indicator">*</span>${msg("form.required.fields")}</div>
      </#if>
         
      <#if form.mode != "view">
         <form id="${formId}" method="${form.method}" accept-charset="utf-8" enctype="${form.enctype}" action="${form.submissionUrl}">
      </#if>
      
      <div id="${formId}-fields" class="form-fields columns-form-fields"> 
        <div class="yui-g">
        <#list form.structure as item>
            <#if item.kind == "set">
              <#if item_has_next>
               		<div class="yui-u first" style="text-align:left">
               <#else>
               		<div class="yui-u">
               </#if>
                <@renderSetWithLabel set=item />
               	</div> 
            <#else>
               <@formLib.renderField field=form.fields[item.id] />
            </#if>
        </#list>
        </div>
      </div>
            
      <#if form.mode != "view">
         <div class="bdft">
           <input id="${formId}-submit" type="submit" value="${msg("form.button.submit.label")}" />
           &nbsp;<input id="${formId}-cancel" type="button" value="${msg("form.button.cancel.label")}" />
         </div>
         </form>
      </#if>
   </div>
</#if>

<#macro renderSetWithLabel set>
   <#if set?size != 0>
   <#if set.appearance?exists>
      <#if set.appearance == "fieldset">
         <fieldset><legend>${set.label}</legend>
      <#elseif set.appearance == "panel">
         <div class="form-panel columns-form-panel">
            <div class="form-panel-heading">${set.label}</div>
            <div class="form-panel-body">
      <#elseif set.appearance == "whitespace">
         <div class="set-whitespace"></div>
      </#if>
   </#if>
   
   <#list set.children as item>
      <#if item.kind == "set">
         <@renderSetWithLabel set=item />
      <#else>
         <@formLib.renderField field=form.fields[item.id] />
      </#if>
   </#list>
   
   <#if set.appearance?exists>
      <#if set.appearance == "fieldset">
         </fieldset>
      <#elseif set.appearance == "panel">
            </div>
         </div>
      </#if>
   </#if>
   </#if>
</#macro>
