<#assign viewFormat>${msg("form.control.date-picker.view.date.format")}</#assign>

<div class="form-field">
   <#assign controlId = fieldHtmlId + "-cntrl">
   
   <script type="text/javascript">//<![CDATA[
   (function()
   {
      var filterDataRange =new Alfresco.FilterDateRange("${controlId}", "${fieldHtmlId}").setMessages(
         ${messages}
      );
      
      YAHOO.Bubbling.on("resetForm" , filterDataRange._handleFieldChangeFrom, filterDataRange);
      YAHOO.Bubbling.on("resetForm" , filterDataRange._handleFieldChangeTo, filterDataRange);
   })();
   //]]></script>
   
   <label for="${controlId}">${field.label?html}:</label>
   
   <input id="${fieldHtmlId}" type="hidden" name="${field.name}-date-range" value="" />
   
   <div id="${controlId}">
      <div class="yui-g" <#if field.control.params.style??>style="${field.control.params.style}"</#if>>
         <div class="yui-u first">
            <span>${msg("form.control.date-range.from")}:</span>
            <div>
               <#-- from date -->
               <input id="${controlId}-date-from" name="-" type="text" class="date-entry" <#if field.description??>title="${field.description}"</#if> tabindex="0" />
               <a id="${controlId}-icon-from"><img src="${url.context}/res/components/form/images/calendar.png" class="datepicker-icon" tabindex="0"/></a>
               <div id="${controlId}-from" class="datepicker"></div>
               
               <div class="format-info">
                  <span class="date-format">${msg("form.control.date-picker.display.date.format")}</span>
               </div>
            </div>
         </div>
         <div class="yui-u">
            <span>${msg("form.control.date-range.to")}:</span>
            <div>
               <#-- to date -->
               <input id="${controlId}-date-to" name="-" type="text" class="date-entry" <#if field.description??>title="${field.description}"</#if> tabindex="0" />
               <a id="${controlId}-icon-to"><img src="${url.context}/res/components/form/images/calendar.png" class="datepicker-icon" tabindex="0"/></a>
               <div id="${controlId}-to" class="datepicker"></div>
               
               <div class="format-info">
                  <span class="date-format">${msg("form.control.date-picker.display.date.format")}</span>
               </div>
            </div>
         </div>
      </div>
   </div>
   
</div>