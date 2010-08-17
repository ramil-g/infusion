/*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

fluid.registerNamespace("fluid.tests");

(function($) {

    fluid.tests.testRendererUtilities = function() {
    
    var binderTests = jqUnit.testCase("Cutpoint utility tests");
    binderTests.test("Renderer Utilities Test: selectorsToCutpoints", function () {
        // Single class name, simple cutpoints generation.
        var selectors = {selector1: ".class1"};
        var expected = [{id: "selector1", selector: ".class1"}];
        jqUnit.assertDeepEq("Selector Map generation", expected, fluid.renderer.selectorsToCutpoints(selectors));
        
        selectors.selector2 = ".class2";
        
        // Multiple selectors with one repeating.
        expected = [{id: "selector1", selector: ".class1"}, {id: "selector2:", selector: ".class2"}];
        var actual = fluid.renderer.selectorsToCutpoints(selectors, {repeatingSelectors: ["selector2"]});
        jqUnit.assertDeepEq("Selector Map generation, with repeating items", expected, actual);
        
        // Ignoring selectors.
        expected = [{id: "selector1", selector: ".class1"}];
        actual = fluid.renderer.selectorsToCutpoints(selectors, {
            selectorsToIgnore: ["selector2"]
        });
        jqUnit.assertDeepEq("Selector Map generation, with ignored selectors", expected, actual);
        jqUnit.assertNotUndefined("selectorsToCutpoints should not eat other people's selectors", selectors.selector2);
        
        // Repeating and ignored selectors.
        expected = [{id: "selector1:", selector: ".class1"}];
        actual = fluid.renderer.selectorsToCutpoints(selectors, {
            repeatingSelectors: ["selector1"], 
            selectorsToIgnore: ["selector2"]
        });
        jqUnit.assertDeepEq("Selector Map generation, with repeating items and ignored selectors", expected, actual);
        jqUnit.assertNotUndefined("selectorsToCutpoints should not eat other people's selectors", selectors.selector2);
    });
    
    
    var protoTests = new jqUnit.TestCase("Protocomponent Expander Tests");
  
        protoTests.test("makeProtoExpander Basic Tests", function() {
            var model = {
                path1: "value1",
                path2: "value2"
            }
            var expander = fluid.renderer.makeProtoExpander({ELstyle: "%", model: model});
            var protoTree = {
                thingery: {messagekey: "myKey", args: ["thing", 3, false, "%path1"]},
                boundValue: "%path2"
            };
            var expanded = expander(protoTree);
            var expected = {
                children: [
                    {ID: "thingery",
                     componentType: "UIMessage",
                     messagekey: "myKey",
                     args: ["thing", 3, false, "value1"]
                    },
                    {ID: "boundValue", 
                     componentType: "UIBound",
                     value: "value2",
                     valuebinding: "path2"
                    }
                ]
            };
            jqUnit.assertDeepEq("Simple expansion", expected, expanded);
        });
       
        protoTests.test("FLUID-3663 test: anomalous UISelect expansion", function() {
            var expander = fluid.renderer.makeProtoExpander({ELstyle: "${}"});
            var protoTree = {
                "authority-history": "${fields.history}",
                "contact-addressType1": {
                    "selection": "${fields.addressType1}",
                    "optionlist": ["Home", "Work"],
                    "optionnames": ["home", "work"]
                    }
                };
            var expanded = expander(protoTree);
            var expected = {
                children: [
                    {ID: "authority-history",
                     componentType: "UIBound",
                     valuebinding: "fields.history"},
                    {ID: "contact-addressType1",
                     componentType: "UISelect",
                     selection: { valuebinding: "fields.addressType1"},
                     optionlist: { value: ["Home", "Work"]},
                     optionnames: { value: ["home", "work"]}
                     }
                 ]
            };
            jqUnit.assertDeepEq("UISelect expansion", expected, expanded);
        });
        
        protoTests.test("FLUID-3682 test: decorators attached to blank UIOutput", function() {
            var expander = fluid.renderer.makeProtoExpander({ELstyle: "${}"});
            var protoTree = {
              ".csc-date-information-date-earliest-single-date-container": { 
                  "decorators": [ 
                      { 
                          "func": "cspace.datePicker", 
                          "type": "fluid" 
                      } 
                  ] 
              }
            };
            var expanded = expander(protoTree);
            var expected = {
                children: [
                    {ID: ".csc-date-information-date-earliest-single-date-container",
                     componentType: "UIBound",
                    "decorators": [ 
                          { 
                              "func": "cspace.datePicker", 
                              "type": "fluid" 
                          } 
                      ] 
                }]};
            jqUnit.assertDeepEq("Decorator expansion", expected, expanded);
        });
        
      
        protoTests.test("FLUID-3659 test: decorators attached to elements with valuebinding", function() {
            var model = {
              queryUrl: "../../chain/loanin/autocomplete/lender",
              vocabUrl: "../../chain/loanin/source-vocab/lender"
            };
            var expander = fluid.renderer.makeProtoExpander({ELstyle: "${}", model: model});
            var protoTree = {
                "loanIn-lender": {
                    valuebinding: "fields.lenders.0.lender",
                    decorators: [{
                            type: "fluid",
                            func: "cspace.autocomplete",
                            options: {
                                queryUrl: "${queryUrl}",
                                vocabUrl: "${vocabUrl}"
                            }
                        }]
                    }
            };
            var expanded = expander(protoTree);
            var expected = {
               children: [
                {ID: "loanIn-lender",
                 componentType: "UIBound",
                 valuebinding: "fields.lenders.0.lender",
                 decorators: [{
                            type: "fluid",
                            func: "cspace.autocomplete",
                            options: {
                                queryUrl: "../../chain/loanin/autocomplete/lender",
                                vocabUrl: "../../chain/loanin/source-vocab/lender"
                            }
                        }]
                    }
               ]};
            jqUnit.assertDeepEq("Decorator expansion", expected, expanded);
        });
        
        protoTests.test("FLUID-3658 test: simple repetition expander", function() {
            var model = {
               vector: [1, 2, 3]
            };
            var messageBundle = {
                siteUrlTemplate: "http://site/path/%element/text.html"
            };
            var expander = fluid.renderer.makeProtoExpander({ELstyle: "${}", model: model});
            var protoTree = {
                expander: {
                    type: "fluid.renderer.repeat",
                    controlledBy: "vector",
                    pathAs: "elementPath",
                    valueAs: "element", 
                    repeatID: "link",
                    tree: 
                      { linktext: "${{elementPath}}",
                        target: {
                            messagekey: "siteUrlTemplate",
                            args: {
                                element: "${{element}}"
                            }          
                        }
                    }
                }
            };
            var expanded = expander(protoTree);
            var node = $(".repeater-leaf-test");
            fluid.selfRender(node, expanded, {
              model: model,
              messageSource: {type: "data", messages: messageBundle}});
            var links = $("a", node);
            jqUnit.assertEquals("Link count", 3, links.length);
            for (var i = 0; i < links.length; ++ i) {
                fluid.testUtils.assertNode("Link rendered", 
                    {nodeName: "a", 
                     href: fluid.stringTemplate(messageBundle.siteUrlTemplate, {element: model.vector[i]}),
                     nodeText: String(model.vector[i])},
                links[i]);
            }
        });
        
        protoTests.test("FLUID-3658 test: recursive expansion with expanders", function() {
            var choices = ["none", "read","write", "delete"];
            var rows = ["Acquisition", "Cataloguing", "Intake", "Loan In", "Loan Out"];
            var model = {
               choices: choices
            };
            model.permissions = fluid.transform(rows, function(row, rowIndex) {
                return {
                    recordType: row,
                    permissions: fluid.transform(fluid.iota(3), function(col) {
                        var value = (rowIndex * 7 + col) %4;
                        return choices[value];
                        })
                    };
            });
            
            var expopts = {ELstyle: "${}", model: model};
            var expander = fluid.renderer.makeProtoExpander(expopts);
        
            var protoTree = { 
                expander: {
                    type: "fluid.renderer.repeat",
                    controlledBy: "permissions",
                    pathAs: "row",
                    repeatID: "permissions-record-row",
                    tree: {
                        expander: {
                            type: "fluid.renderer.repeat",
                            controlledBy: "{row}.permissions",
                            pathAs: "permission",
                            repeatID: "permissions-record-column",
                            tree: {
                                expander: {                  
                                   type: "fluid.renderer.selection.inputs",
                                   rowID: "permissions-record-role-row",
                                   labelID: "permissions-record-role-label",
                                   inputID: "permissions-record-role-input",
                                   selectID: "permissions-record-permissions",
                                   tree: {
                                      "selection": "${{permission}}",
                                      "optionlist": "${choices}",
                                      "optionnames": "${choices}",
                                      //"default": "write"
                                   }
                             },
                        }
                    },
                    "permissions-record-type": "${{row}.recordType}"
                }
            }
        };
        
        var expanded = expander(protoTree);
        var node = $(".recursive-expansion-test");
        fluid.selfRender(node, expanded, {
              model: model});
        var radios = $("input", node);
        jqUnit.assertEquals("Radio button count", model.permissions.length * model.permissions[0].permissions.length * choices.length, 
            radios.length);
        
        var spans = $("span", node);
        jqUnit.assertEquals("Span count", model.permissions.length, spans.length);
        
        });
        
        function deleteComponentTypes (tree) {
            return fluid.transform(tree, function(el) {
                if (fluid.isPrimitive(el)) {
                    return el;
                }
                else if (el.componentType) {
                    delete el.componentType;
                }
                return deleteComponentTypes(el);
            });
        }
        
        protoTests.test("Non-expansion expander test", function() {
            var model = {
              queryUrl: "../../chain/loanin/autocomplete/lender",
              vocabUrl: "../../chain/loanin/source-vocab/lender"
            };
            var expander = fluid.renderer.makeProtoExpander({ELstyle: "${}", model: model});
            var protoTree = {
                component1: "${path1}",
                component2: {
                    valuebinding: "path2",
                    decorators: {
                        type: "fluid",
                        func: "cspace.autocomplete",
                        options: {
                            queryUrl: "${queryUrl}",
                            vocabUrl: "${vocabUrl}",
                            componentTree: {
                                expander: {
                                    type: "fluid.expander.noexpand",
                                    tree: {
                                        component1: "${path1}"
                                    }
                                }
                            }
                        }
                    }
                }
            };
            var expanded = expander(protoTree);
            var expected = {
                children: [
                    {ID: "component1",
                     componentType: "UIBound",
                     valuebinding: "path1"},
                    {ID: "component2",
                     componentType: "UIBound",
                     valuebinding: "path2",
                     decorators: {
                         type: "fluid",
                         func: "cspace.autocomplete",
                         options: {
                             queryUrl: "../../chain/loanin/autocomplete/lender",
                             vocabUrl: "../../chain/loanin/source-vocab/lender",
                             componentTree: {
                                 component1: "${path1}"
                             }
                         }
                     }
                  }
               ]};
            jqUnit.assertDeepEq("Decorator non-expansion", expected, expanded);
        });
        
        protoTests.test("FLUID-3658 test: selection to inputs expander", function() {
            var model = { };
            var expopts = {ELstyle: "${}", model: model};
            var expander = fluid.renderer.makeProtoExpander(expopts);
            var protoTree = {
                "permissions-record-row": {
                    "children": [ 
                        {expander: {                  
                             type: "fluid.renderer.selection.inputs",
                             rowID: "permissions-record-role-row",
                             labelID: "permissions-record-role-label",
                             inputID: "permissions-record-role-input",
                             selectID: "permissions-record-permissions",
                             tree: {
                                "selection": "${fields.permissions.0.permission}",
                                "optionlist": ["none", "read", "write", "delete"],
                                "optionnames": ["none", "read","write", "delete"]
                                //"default": "write" // this non-specified field might be expanded to a UIBound by the protoExpander
                             }
                         },
                        "permissions-record-type": "${fields.permissions.0.recordType}"
                     }
                ]
            }};
            var expanded = expander(protoTree);
            expanded = deleteComponentTypes(expanded);
            
            var expint = protoTree["permissions-record-row"]["children"][0];
            var expopt = expint.expander;
            expopt.rowID = expopt.rowID + ":"; // the expander automatically aligns colons for repetition
            var selection = expopt.tree;
            var manualExpand = fluid.explodeSelectionToInputs(selection.optionlist, expopt);
            selection.ID = "permissions-record-permissions";
            selection.selection = {
                valuebinding: fluid.extractEL(selection.selection, expopts)
            };
            selection.optionlist = selection.optionnames = {value: selection.optionlist};
            var expected = {
                children: [
                {
                  ID: "permissions-record-row:",
                  children: [selection].concat(manualExpand).concat({
                    ID: "permissions-record-type",
                    valuebinding: "fields.permissions.0.recordType"})
                }]
            };
            fluid.testUtils.assertTree("Selection explosion", expected, expanded);
        });
    };  
})(jQuery); 