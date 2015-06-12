<script type="text/javascript">//<![CDATA[
new Alfresco.DatalistVersions("${args.htmlid}").setOptions(
{
   versions: [
<#list versions as version>
      {
         label: "${version.label}",
         createdDate: "${version.createdDate}",
         nodeRef: "${version.nodeRef}"
      }<#if (version_has_next)>,</#if>
</#list>
   ],
   filename: "${filename!}",
   nodeRef: "${nodeRef!}"
}).setMessages(
   ${messages}
);
//]]></script>

<div id="${args.htmlid}-body" class="document-versions">

      <#list versions as version>
         <a id="${args.htmlid}-expand-a-${version_index}" class="info more collapsed" href="#">
            <span class="meta-section-label theme-color-1">${msg("label.label")} ${version.label} <#if version_index == 0>${msg("label.current")}</#if></span>
            <span id="${args.htmlid}-createdDate-span-${version_index}" class="meta-value">&nbsp;</span>
         </a>
         <div id="${args.htmlid}-moreVersionInfo-div-${version_index}" class="moreInfo" style="display: none;">
            <div class="info">
               <span class="meta-label">${msg("label.creator")}</span>
               <span class="meta-value">${version.creator.firstName?html} ${version.creator.lastName?html}</span>
            </div>
            <div class="actions">
                  <span><a id="${args.htmlid}-display-a-${version_index}" class="view" href="#">${msg("link.display")}</a></span>
            </div>
         </div>
      </#list>

</div>
