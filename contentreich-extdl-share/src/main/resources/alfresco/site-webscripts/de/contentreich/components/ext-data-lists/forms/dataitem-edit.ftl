<#--@markup id="widgets">
    <#if nodeRef??>
        <@createWidgets group="comments"/>
    </#if>
</@-->
<#if error?exists>
   <div class="error">${error}</div>
<#elseif form?exists>

   <#assign id=args.htmlid>
	<#if formUI == "true">
	   <@formLib.renderFormsRuntime formId=formId />
	</#if>
<script>
    // alert('${url.args}');
    <#assign nodeRef = argsM['itemId'][0]/>
    new Alfresco.CommentsList("${id}-comments").setOptions({
        "maxItems": 10.0,
        "activity": {
            "itemTitle": "Contracts",
            "pageParams": {
                "nodeRef": "${nodeRef}"
            },
            "page": "document-details"
        },
        "editorConfig": {
            "toolbar": "bold italic underline | bullist numlist | forecolor backcolor | undo redo removeformat",
            "language": Alfresco.constants.JS_LOCALE,
            "statusbar": false,
            "menu": {}
        },
        "nodeRef": "${nodeRef}",
        "siteId": Alfresco.constants.SITE
    }).setMessages(
        ${messages});
</script>

<div id="${formId}-container" class="theme-bg-color-1 form-container columns-form-container">
      <#if form.showCaption?exists && form.showCaption>
         <div id="${formId}-caption" class="caption"><span class="mandatory-indicator">*</span>${msg("form.required.fields")}</div>
      </#if>
         
      <#--if form.mode != "view">
         <form id="${formId}" method="${form.method}" accept-charset="utf-8" enctype="${form.enctype}" action="${form.submissionUrl}">
      </#if-->

      <div id="${formId}-fields" class="form-fields columns-form-fields"> 
        <div class="yui-g">
<#if form.mode != "view">
   <form id="${formId}" method="${form.method}" accept-charset="utf-8" enctype="${form.enctype}" action="${form.submissionUrl}">
</#if>
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
        <#if form.mode != "view">
           <div class="yui-u">
             <input id="${formId}-submit" type="submit" value="${msg("form.button.submit.label")}" />
             &nbsp;<input id="${formId}-cancel" type="button" value="${msg("form.button.cancel.label")}" />
           </div>
           </form>
        </#if>

<#--@markup id="html">
    <@uniqueIdDiv-->
    <#assign el="${id?html}-comments">
<div class="yui-u" id="${el}">
    <!--#if nodeRef??-->
    <div id="${el}-body" class="comments-list">
        <h2 class="thin dark">${msg("header.comments")}</h2>
        <div id="${el}-add-comment">
            <div id="${el}-add-form-container" class="theme-bg-color-4 hidden"></div>
        </div>
        <div class="comments-list-actions">
            <div class="left">
                <div id="${el}-actions" class="hidden">
                    <button class="alfresco-button" name=".onAddCommentClick">${msg("button.addComment")}</button>
                </div>
            </div>
            <div class="right">
                <div id="${el}-paginator-top"></div>
            </div>
            <div class="clear"></div>
        </div>
        <hr class="hidden"/>
        <div id="${el}-comments-list"></div>
        <hr class="hidden"/>
        <div class="comments-list-actions">
            <div class="left">
            </div>
            <div class="right">
                <div id="${el}-paginator-bottom"></div>
            </div>
            <div class="clear"></div>
        </div>
    </div>
</div>
<#--/#if>
</@>
</@-->

      <#--if form.mode != "view">
         <div class="bdft">
           <input id="${formId}-submit" type="submit" value="${msg("form.button.submit.label")}" />
           &nbsp;<input id="${formId}-cancel" type="button" value="${msg("form.button.cancel.label")}" />
         </div>
         </form>
      </#if-->

</div>
</div>
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
