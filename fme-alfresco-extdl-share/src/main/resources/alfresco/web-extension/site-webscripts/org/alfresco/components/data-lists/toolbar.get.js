/**
 * Main entrypoint for component webscript logic
 *
 * @method main
 */
function main()
{
   // Actions
   var myConfig = new XML(config.script),
      xmlActionSet = myConfig.actionSet,
      actionSet = [];
   
   for each (var xmlAction in xmlActionSet.action)
   {
      actionSet.push(
      {
         id: xmlAction.@id.toString(),
         type: xmlAction.@type.toString(),
         permission: xmlAction.@permission.toString(),
         asset: xmlAction.@asset.toString(),
         href: xmlAction.@href.toString(),
         label: xmlAction.@label.toString()
      });
   }
   
   model.actionSet = actionSet;
   
   // Widget instantiation metadata...
   var toolbar = {
      id : "DataListToolbar",
      name : "Alfresco.component.ExtDataListToolbar",
      options : {
         siteId : (page.url.templateArgs.site != null) ? page.url.templateArgs.site : ""
      }
   };
   
   model.widgets = [toolbar];
}

main();

