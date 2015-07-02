Datalist Extensions for Alfresco Share (for Alfresco)
===========================================================

Altough the project has not seen a lot of testing on 5.0.x - this version of Alfresco is the primary target and the master branch requires Alfresco 5 to work properly.


*Warning*: Starting with version 1.4.0, I started weeding out all the overwriting which causes tons of issues. Hence, you might be missing features provided by the old hacked model. I may reintroduce these model tweaks as a propert extension (not overriding model).

Installation
============

* Run `mvn package`
* Put `./fme-alfresco-extdl-share/target/fme-alfresco-extdl-share-x.y.jar` in `tomcat/shared/lib` or `tomcat/webapps/share/WEB-INF/lib`
* Put `./fme-alfresco-extdl-repo/target/fme-alfresco-extdl-repo-x.y.jar` in `tomcat/webapps/alfresco/WEB-INF/lib`

Customization Example (Actually a pretty awesome hack)
======================================================
See repo custom context for an approach: https://github.com/tass01024/fme-alfresco-extdl/blob/master/fme-alfresco-extdl-repo/example/my-custom-datalists-context.xml

Thanks Jan for supporting me !
