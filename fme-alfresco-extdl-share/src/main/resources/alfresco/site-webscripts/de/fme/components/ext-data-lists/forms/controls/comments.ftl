<#include "common/editorparams.inc.ftl" />
<#if ((form.mode == "edit" || form.mode == "view") && args.itemId??)>
<div class="form-field">
   <#if form.mode == "edit">
      <label for="${fieldHtmlId}">${msg("form.label.comment.add")}</label>
      <textarea id="${fieldHtmlId}" name="${field.name}" rows="${rows}" cols="${columns}" tabindex="0"
        <#if field.description??>title="${field.description}"</#if>
        <#if field.control.params.styleClass??>class="${field.control.params.styleClass}"</#if>
        <#if field.control.params.style??>style="${field.control.params.style}"</#if>
        <#if field.disabled && !(field.control.params.forceEditable?? && field.control.params.forceEditable == "true")>disabled="true"</#if>>${field.value?html}</textarea>
      <@formLib.renderFieldHelp field=field />
   </#if>
<script type="text/javascript">//<![CDATA[
new Alfresco.CommentsControls("${fieldHtmlId}-list").setOptions(
{
  height: ${args.editorHeight!180},
  width: ${args.editorWidth!700},
  <#if (form.mode == "edit" || form.mode == "view") && args.itemId??>
      itemNodeRef: "${args.itemId?js_string}"
  <#else>
      itemNodeRef: ""
  </#if>
}).setMessages(${messages});//]]>
</script>
   <div id="${fieldHtmlId}-list" class="comment-list" style="display:none;">
       <div class="postlist-infobar">
          <div id="${fieldHtmlId}-list-paginator" class="paginator"></div>
       </div>
       <div class="clear"></div>
       <h3>${msg("form.label.comments")}</h3>
       <div id="${fieldHtmlId}-list-comments"></div>
   </div>
</div>
</#if>