<#list set.children as item>
   <#if item.kind != "set">
      <#if (item_index % 4) == 0>
      <div class="yui-g"><div class="yui-g first"><div class="yui-u first">
      <#elseif (item_index % 4) == 2>
      <div class="yui-g"><div class="yui-u first">
      <#else>
      <div class="yui-u">
      </#if>
      <@formLib.renderField field=form.fields[item.id] />
      </div>
      <#if ((item_index % 4) == 1)>
      </div> 
      <#elseif ((item_index % 4) == 3)>
      </div></div>
      </#if>
   </#if>
</#list>


