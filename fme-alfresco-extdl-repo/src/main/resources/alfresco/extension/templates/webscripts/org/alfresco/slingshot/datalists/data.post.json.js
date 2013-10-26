<import resource="classpath:alfresco/templates/webscripts/org/alfresco/slingshot/datalists/evaluator.lib.js">
<import resource="classpath:alfresco/extension/templates/webscripts/org/alfresco/slingshot/datalists/filters.lib.js">
<import resource="classpath:alfresco/extension/templates/webscripts/org/alfresco/slingshot/datalists/parse-args.lib.js">

const REQUEST_MAX = 1000;

/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */


// var ESCAPES = [[/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"], [/"/g, "&quot;"]]

function escape(value) {
	return value.replace('"','');
	/*
	var escaped = value;
	for(var item in ESCAPES)
	    escaped = escaped.replace(ESCAPES[item][0], ESCAPES[item][1]);
	return escaped;
	*/
}

function filterRange(array, range) {
	logger.log("Applying " + range.prop + " range filter " + range.min + " <= x <= " + range.max);
	var filtered = [];
	for (var i=0; i<array.length; i++) {
		obj = array[i];
		logger.log(obj.properties[range.prop]);
		var minOk = !range.min || (obj.properties[range.prop] && (range.min.getTime() <= obj.properties[range.prop].getTime()));
		var maxOk = !range.max || (obj.properties[range.prop] && (obj.properties[range.prop].getTime() <= range.max.getTime()));
		if (minOk && maxOk) {
			filtered.push(obj);
		}
	}
	
	return filtered;
}

function xPathFilterQuery(filterData) {
	var rangeFilters = [];
	var fieldQuery = [];
	var fieldNamesIterator = filterData.getFieldNames().iterator();
	for ( ; fieldNamesIterator.hasNext(); ){
		var fieldName = fieldNamesIterator.next();
		if (filterData.getFieldData(fieldName).getValue()!= ""){
			var propName = fieldName.replace("prop_","").replace("_",":");
	    	var value = new String(filterData.getFieldData(fieldName).getValue());
	    	if (propName.indexOf("-date-range") > 0){
	    		propName = propName.replace("-date-range","");
	    		rf = { prop: propName };
				var dates = value.split("TO");
				if (dates[0] == ""){
					rf.max =  utils.fromISO8601(dates[1]);
				}
				else if (dates[1] == ""){
					rf.min = utils.fromISO8601(dates[0]);
				}else{
					rf.min =  utils.fromISO8601(dates[0]);
					rf.max = utils.fromISO8601(dates[1]);
				}
	    		rangeFilters.push(rf);
	    	}
	    	else if (propName.indexOf("Priority") > 0 || propName.indexOf("Status") > 0){
				var values = value.split(",");
				var escaped = [];
				for (var i=0;i<values.length;i++) {
					escaped.push('"' + escape(values[i]) + '"');
				}
				fieldQuery.push('(@' + propName + '=' + escaped.join(' or @' + propName + '=') + ')');
	    	} 
	    	else{
	    		fieldQuery.push("(like(@" + propName + ',"*' + escape(value) + '*"))');
	    	}
	    	
		}
	}
	return {
		rangeFilters : rangeFilters,
		propQuery : "[" + fieldQuery.join(" and ") + "]" 
	}
}

/**
 * Main entry point: Return data list with properties being supplied in POSTed arguments
 *
 * @method getData
 */
function getData()
{
   // Use helper function to get the arguments
   var parsedArgs = ParseArgs.getParsedArgs();
   if (parsedArgs === null)
   {
      return;
   }

   var fields = null;
   // Extract fields (if given)
   if (json.has("fields"))
   {
      // Convert the JSONArray object into a native JavaScript array
      fields = [];
      var jsonFields = json.get("fields"),
         numFields = jsonFields.length();
      
      for (count = 0; count < numFields; count++)
      {
         fields.push(jsonFields.get(count).replaceFirst("_", ":"));
      }
   }

   // Try to find a filter query based on the passed-in arguments
   var filter = parsedArgs.filter,
      allNodes = [], node,
      items = [];

   if (filter == null || filter.filterId == "all")
   {
      // Use non-query method
      var parentNode = parsedArgs.listNode;
      if (parentNode != null)
      {
         var pagedResult = parentNode.childFileFolders(true, false, Filters.IGNORED_TYPES, -1, -1, REQUEST_MAX, "cm:name", true, null);
         allNodes = pagedResult.page;
      }
   }
   else
   {
	  // XPath for solr systems
	  var n = search.findNode(parsedArgs.nodeRef);
	  var q = xPathFilterQuery(filter.filterData);
	  // logger.log(parsedArgs.nodeRef + " -> *" + q.propQuery);
	  var res = n.childrenByXPath("* " + q.propQuery);
	  logger.log("Got " + res.length + " results, " + q.rangeFilters.length + " range filters");
	  for (var i=0; i<q.rangeFilters.length; i++) {
		  res = filterRange(res, q.rangeFilters[i]);
	  }
	  allNodes = res;
	  /*
      var filterParams = Filters.getFilterParams(filter, parsedArgs)
         query = filterParams.query;
      // Query the nodes - passing in default sort and result limit parameters
      if (query !== "")
      {
         allNodes = search.query(
         {
            query: query,
            language: filterParams.language,
            page:
            {
               maxItems: (filterParams.limitResults ? parseInt(filterParams.limitResults, 10) : 0)
            },
            sort: filterParams.sort,
            templates: filterParams.templates,
            namespace: (filterParams.namespace ? filterParams.namespace : null)
         });
      }
      */
   }

   if (allNodes.length > 0)
   {
      for each (node in allNodes)
      {
         try
         {
             items.push(Evaluator.run(node, fields));
         }
         catch(e) {}
      }
   }

   return (
   {
      fields: fields,
      paging:
      {
         totalRecords: items.length,
         startIndex: 0
      },
      parent:
      {
         node: parsedArgs.listNode,
         userAccess:
         {
            create: parsedArgs.listNode.hasPermission("CreateChildren")
         }
      },
      items: items
   });
}

model.data = getData();