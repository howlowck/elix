/*
 * Elix enhancements to JSDoc
 * 
 * These include:
 * * Using @inherits to indicate inheritance instead of @augments (so that JSDoc
 *   doesn't try to process base classes).
 * * Using @mixes to identify mixins.
 * * Members from base classes and mixins are copied into their inherited
 *   classes.
 * * `originalmemberof` field tracks which base class or mixin originally
 *   provided the member.
 * * `mixinOrigins` field tracks which class in the hierarchy provided a mixin.
 * * `inheritance` field tracks an object's list of base classes.
 * * `classInheritedBy` field tracks a classes list of subclasses (including
 *   subsubclasses, etc.).
 * 
 * These routines work with the following objects:
 * "projectDocs": the complete set of JSDoc documentation for the project. This maps
 * object names to their corresponding documentation ("objectDocs").
 * "objectDocs": the JSDoc documentation for a single object.
 * "primaryDoclet": the zeroth documentation item in an JSDoc array.
 * "memberDoclets": all items in a JSDoc array after the zeroth item.
 */


/*
 * Given a primaryDoclet, return the base class name if present.
 * Ignore "HTMLElement" as a base class name.
 */
function baseClassNameInDoclet(primaryDoclet) {
  // Base class is identified by custom @inherits tag.
  const customTags = primaryDoclet.customTags;
  const baseClassName = customTags && customTags.length > 0 && 
      customTags[0].tag === 'inherits' && customTags[0].value;
  return baseClassName && baseClassName !== 'HTMLElement' ?
    baseClassName :
    null;
}

/*
 * Make a deep copy of a object.
 */
function clone(object) {
  return JSON.parse(JSON.stringify(object));
}

/*
 * Top-level entry point to add Elix documentation extensions to JSDoc project
 * documentation.
 * 
 * This is a destructive in-place operation.
 */
function extendDocs(projectDocs) {
  // Extend each documented object.
  const objectsDocs = Object.values(projectDocs);
  objectsDocs.forEach(objectDocs => {
    extendObjectDocs(projectDocs, objectDocs);
  });

  // Sort final classInheritedBy values.
  objectsDocs.forEach(objectDocs => {
    const objectDoclet = primaryDoclet(objectDocs);
    const classInheritedBy = objectDoclet.classInheritedBy;
    if (classInheritedBy) {
      classInheritedBy.sort();
    }
  });
}

/*
 * Extend the documentation for a specific object.
 */
function extendObjectDocs(projectDocs, objectDocs) {

  const objectDoclet = primaryDoclet(objectDocs);

  // Have we already taken care of extending this object's documentation?
  if (objectDoclet.extended) {
    return;
  }
  objectDoclet.extended = true;

  // Indicate the object's own members as originally coming from this object.
  memberDoclets(objectDocs).forEach(memberDoclet => {
    memberDoclet.originalmemberof = objectDoclet.name;
  });

  // Declare this object is origin of any mixins directly on it.
  if (!objectDoclet.mixes) {
    objectDoclet.mixes = [];
  }
  objectDoclet.mixinOrigins = new Array(objectDoclet.mixes.length);
  objectDoclet.mixinOrigins.fill(objectDoclet.name);

  // Process each mixin.
  objectDoclet.mixes.forEach((mixinName, index) => {
    const mixinDocs = projectDocs[mixinName];
    // Extend mixin docs before consuming.
    extendObjectDocs(projectDocs, mixinDocs);
    extendClassDocsWithMixin(objectDocs, mixinDocs);
  });

  // Process base class if one is defined.
  const baseClassName = baseClassNameInDoclet(objectDoclet);
  if (baseClassName) {
    const baseClassDocs = projectDocs[baseClassName];
    // Extend base class docs before consuming.
    extendObjectDocs(projectDocs, baseClassDocs);
    extendClassDocsWithBaseClass(objectDocs, baseClassDocs);
    updateInheritanceRecords(projectDocs, objectDocs);
  }

  // Reestablish member sort order.
  sortDoclets(objectDocs);
}

/*
 * Update the documentation for the given class to reflect mixins and members
 * inherited from the given base class.
 */
function extendClassDocsWithBaseClass(classDocs, baseClassDocs) {

  const classDoclet = primaryDoclet(classDocs);
  const baseClassDoclet = primaryDoclet(baseClassDocs);

  // Add the base class members to this class.
  extendObjectDocsWithMembers(classDocs, baseClassDocs, baseClassDoclet.name);
  
  // Add the base class's mixins to the object's list of mixins.
  const baseMixins = baseClassDoclet.mixes || [];
  if (!classDoclet.mixes) {
    classDoclet.mixes = [];
  }
  classDoclet.mixes = classDoclet.mixes.concat(baseMixins);

  // Record that this base class is the origin for these mixins.
  const baseMixinOrigins = new Array(baseMixins.length);
  baseMixinOrigins.fill(baseClassDoclet.name);
  classDoclet.mixinOrigins = classDoclet.mixinOrigins.concat(baseMixinOrigins);
}

/*
 * Update the documentation for the given object to reflect mixins and members
 * applied by the given mixin.
 */
function extendClassDocsWithMixin(objectDocs, mixinDocs) {

  const objectDoclet = primaryDoclet(objectDocs);
  const mixinDoclet = primaryDoclet(mixinDocs);

  // Add the mixin members to this class.
  extendObjectDocsWithMembers(objectDocs, mixinDocs, objectDoclet.name);

  // Record that this mixin is being used by this object.
  if (!mixinDoclet.mixinUsedBy) {
    mixinDoclet.mixinUsedBy = [];
  }
  mixinDoclet.mixinUsedBy.push(objectDoclet.name);
}

/*
 * Copy the documented members of the source (a base class or mixin) to the
 * documented target. Use the supplied inheritedfrom value to indicate how these
 * members were inherited.
 */
function extendObjectDocsWithMembers(targetDocs, sourceDocs, inheritedfrom) {
  const targetDoclet = primaryDoclet(targetDocs);
  const sourceDoclet = primaryDoclet(sourceDocs);
  memberDoclets(sourceDocs).forEach(memberDoclet => {
    const docletCopy = clone(memberDoclet);
    docletCopy.memberof = targetDoclet.name;
    if (inheritedfrom && !docletCopy.inheritedfrom) {
      docletCopy.inheritedfrom = inheritedfrom;
    }
    targetDocs.push(docletCopy);
  });
}

/*
 * Return the array of member documentation for the given object.
 */
function memberDoclets(objectDocs) {
  return objectDocs.slice(1);
}

/*
 * Return the primary JSDoc doclet for the given object.
 */
function primaryDoclet(objectDocs) {
  return objectDocs[0];
}

/*
 * Sort the JSDoc doclets for the given object.
 */
function sortDoclets(objectDocs) {
  // Sort the array, leaving the primary doclet at index 0.
  objectDocs.sort((a, b) => {
    if (a.order === 0) { return -1; }
    if (b.order === 0) { return 1; }
    return a.name.localeCompare(b.name);
  });
  // Set the order value
  objectDocs.map((doclet, index) => {
    doclet.order = index;
  });
}

/*
 * Record that the indicated class inherits from its base classes, and that
 * those classes are inherited by this class.
 */
function updateInheritanceRecords(projectDocs, classDocs) {
  const classDoclet = primaryDoclet(classDocs);
  classDoclet.inheritance = [];
  
  // Walk up class hierarchy.
  let baseClassName = baseClassNameInDoclet(classDoclet);
  while (baseClassName) {
    // This class inherits from this base class.
    classDoclet.inheritance.push(baseClassName);
    const baseClassDocs = projectDocs[baseClassName];
    if (baseClassDocs) {
      const baseClassDoclet = primaryDoclet(baseClassDocs);
      // This base class is inherited by this class.
      if (!baseClassDoclet.classInheritedBy) {
        baseClassDoclet.classInheritedBy = []
      }
      baseClassDoclet.classInheritedBy.push(classDoclet.name);
      baseClassName = baseClassNameInDoclet(baseClassDoclet);
    } else {
      baseClassName = null;
    }
  }
}


module.exports = extendDocs;
