b3e.editor.ExportManager = function(editor) {
  "use strict";

  function getBlockChildrenIds(block) {
    var conns = block._outConnections.slice(0);
    if (editor._settings.get('layout') === 'horizontal') {
      conns.sort(function(a, b) {
        return a._outBlock.y - 
               b._outBlock.y;
      });
    } else {
      conns.sort(function(a, b) {
        return a._outBlock.x - 
               b._outBlock.x;
      });
    }

    var nodes = [];
    for (var i=0; i<conns.length; i++) {
      nodes.push(conns[i]._outBlock.id);
    }

    return nodes;
  }

  this.projectToData = function() {
    var project = editor.project.get();
    if (!project) return;

    var tree = project.trees.getSelected();

    var data = {
      version      : b3e.VERSION,
      scope        : 'project',
      selectedTree : (tree?tree._id:null),
      trees        : [],
      custom_nodes : this.nodesToData()
    };

    project.trees.each(function(tree) {
      var d = this.treeToData(tree, true);
      d.id = tree._id;
      data.trees.push(d);
    }, this);

    return data;
  };
  
  this.treeToData = function(tree, ignoreNodes) {
    var project = editor.project.get();
    if (!project) return;

    if (!tree) {
      tree = project.trees.getSelected();
    } else {
      tree = project.trees.get(tree);
      if (!tree) return;
    }

    var root = tree.blocks.getRoot();
    var first = getBlockChildrenIds(root);
    var data = {
      version      : b3e.VERSION,
      scope        : 'tree',
      id           : tree._id,
      title        : root.title,
      description  : root.description,
      root         : first[0] || null,
      properties   : root.properties,
      nodes        : {},
      display     : {
        camera_x : tree.x,
        camera_y : tree.y,
        camera_z : tree.scaleX,
        x        : root.x,
        y        : root.y,
      },
    };

    if (!ignoreNodes) {
      data.custom_nodes = this.nodesToData();
    }

    tree.blocks.each(function(block) {
      if (block.category !== 'root') {
        var d ={
          id          : block.id,
          name        : block.name,
          title       : block.title,
          description : block.description,
          properties  : block.properties,
          display     : {x:block.x, y:block.y}
        };

        var children = getBlockChildrenIds(block);
        if (block.category === 'composite') {
          d.children = children;
        } else if (block.category === 'decorator') {
          d.child = children[0];
        }

        data.nodes[block.id] = d;
      }
    });

    return data;
  };

  this.nodesToData = function() {
    var project = editor.project.get();
    if (!project) return;

    var data = [];
    project.nodes.each(function(node) {
      if (!node.isDefault) {
        data.push({
          version     : b3e.VERSION,
          scope       : 'node',
          name        : node.name,
          category    : node.category,
          title       : node.title,
          description : node.description,
          properties  : node.properties,
        });
      }
    });

    return data;
  };

  this.exportLightTree = function (tree) {
    var project = editor.project.get();
    if (!project) return;

    if (!tree) {
      tree = project.trees.getSelected();
    } else {
      tree = project.trees.get(tree);
      if (!tree) return;
    }

    var root = tree.blocks.getRoot();
    var first = getBlockChildrenIds(root);
    var data = {
      root         : first[0] || null,
      properties   : root.properties,
      nodes        : {},
    };

    var replaceTreeIds = {};

    tree.blocks.each(function(block) {
      if (block.category === 'tree') {
        var subTree = project.trees.get(block.name);
        if (subTree) {
          var subData = this.exportLightTree(subTree, true);
          var subNodes = subData.nodes;
          for (var sub in subNodes) {
            data.nodes[sub] = subNodes[sub];
          }
          replaceTreeIds[block.id] = subData.root;
        }
      } else if (block.category !== 'root') {
        var d ={
          id          : block.id,
          name        : block.name,
          properties  : block.properties,
        };

        var children = getBlockChildrenIds(block);
        if (block.category === 'composite') {
          d.children = children;
        } else if (block.category === 'decorator') {
          d.child = children[0];
        }

        data.nodes[block.id] = d;
      }
    }.bind(this));

    var allNodes = data.nodes;
    for (var id in allNodes) {
      var node = allNodes[id];
      if (node.child) {
        node.child = replaceTreeIds[node.child] || node.child;
      } else if (node.children) {
        var children = node.children;
        for (var i = 0; i < children.length; i++) {
          var origin = children[i];
          children[i] = replaceTreeIds[origin] || origin;
        }
      }
    }

    return data;
  };

  this.nodesToData = function() {
    var project = editor.project.get();
    if (!project) return;

    var data = [];
    project.nodes.each(function(node) {
      if (!node.isDefault) {
        data.push({
          version     : b3e.VERSION,
          scope       : 'node',
          name        : node.name,
          category    : node.category,
          title       : node.title,
          description : node.description,
          properties  : node.properties,
        });
      }
    });

    return data;
  };

  this.nodesToJavascript = function() {};

  this._applySettings = function(settings) {};
};