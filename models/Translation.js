var keystone = require('keystone'),
  async = require('async'),
  _ = require('underscore'),
  util = require('util'),
  Types = keystone.Field.Types;

/**
 * Translation Model
 * =============
 */

var Translation = new keystone.List('Translation', {
  track: true,
  drilldown: "authors"
});

Translation.add({
  title: { type: Types.Text, collapse: true },
  when: { type: Types.Date, default: Date.now, initial: true },
  author: { type: Types.Relationship, ref: 'Student', hidden: true  },
  authors: { type: Types.Relationship, ref: 'Student', initial: true, index: true, many: true },
  editor: { type: Types.Relationship, ref: 'Student', filters: { canEditArticles: true }, initial: true },
  articleUrl: { type: Types.Url, collapse: true },
  translationUrl: { type: Types.Url, collapse: true },
}, 'Meta', {
  partial: { type: Types.Boolean, default: false, hidden: true },
  multipleAuthors: { type: Types.Boolean, noedit: true },
});

/**
 * Hooks
 * =====
 */

Translation.schema.post('init', function() {
    this._original = this.toObject();
} );

Translation.schema.post('save', function() {
  var prevAuthors = [];

  if (this._original != undefined) {
    //console.log("Comparing translation to previous version.")
    var arr1 = _.pluck(this._original.authors, "id");
    var arr2 = _.pluck(this.authors, "id");
    var diff = _.difference(arr1, arr2);

    prevAuthors = _.filter(this._original.authors, function(obj) { return diff.indexOf(obj.id) >= 0; });

    //console.log("Translation had " + prevAuthors.length + " author(s) previously.")
  }

  //debugger;

	keystone.list('Student').model.find().where('_id').in(this.authors).exec(
    function(err, students) {

      async.each(students,
        function(student, _next) {
          //console.log("Post save -> student: " + student);

          student.refreshTranslations();
          _next();
		    }, function(err) {
          if (err) {
            console.error('===== Error updating translation author  =====');
          }
		    }
      );
    }
  );

  if (prevAuthors.length > 0) {
    keystone.list('Student').model.find().where('_id').in(prevAuthors).exec(
      function(err, students) {

        async.each(students,
          function(student, _next) {
            //console.log("Post save -> student: " + student);

            student.refreshTranslations();
            _next();
          }, function(err) {
            if (err) {
              console.error('===== Error updating previous translation author  =====');
            }
          }
        );
      }
    );
  }

});

Translation.schema.pre('save', function(next) {
  var translation = this;

  async.parallel([

    function(done) {
      //console.log("Translation has " + translation.authors.length + " author(s).")
      if (translation.authors.length > 1) {
        translation.multipleAuthors = true
      } else {
        translation.multipleAuthors = false
      }

      return done();
    }

  ], next);
});

Translation.schema.post('remove', function() {
	keystone.list('Student').model.findById(this.authors, function(err, student) {
		if (student) student.refreshTranslations();
	});
})


Translation.schema.methods.toCSV = function(row, callback) {

  // we don't need the previously used fields
  delete row.author;
  delete row.partial;

  callback(null, row);

  /*if (rtn.editor != undefined) {
    rtn.editor_id = rtn.editor.key;
  }

  this.populate('authors', function() {
      rtn.author_ids = translation.authors.map(function(i) { return i.key });
      callback(null, rtn);
  });*/

};


/**
 * Registration
 * ============
 */

Translation.defaultSort = '-when';
Translation.defaultColumns = 'when, authors';
Translation.register();
