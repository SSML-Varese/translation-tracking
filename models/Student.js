var keystone = require('keystone'),
	async = require('async'),
  Types = keystone.Field.Types;

/**
 * Enquiry Model
 * =============
 */

var Student = new keystone.List('Student', {
  track: true
});

Student.add({
  name: { type: Types.Name, required: true },
  matricola: { type: Types.Number, required: true, initial: true, format: false },
}, 'Permissions', {
	canTranslateArticles: { type: Types.Boolean, default: true, index: true },
	canEditArticles: { type: Types.Boolean, default: false, index: true, initial: true },
}, 'Meta', {
	translationCount: { type: Number, default: 0, noedit: true },
  totalFullTranslations: { type: Number, noedit: true, label: "Full Translations" },
  totalPartialTranslations: { type: Number, noedit: true, label: "Shared Translations" },
  lastTranslation: { type: Types.Date, noedit: true },
	editedCount: { type: Number, default: 0, noedit: true },
});


/**
	Pre-save
	=============
*/

Student.schema.pre('save', function(next) {

	var student = this;

	async.parallel([

		function(done) {

			keystone.list('Translation').model.count({ authors: student.id }).where('multipleAuthors', false).exec(function(err, count) {

				if (err) {
					console.error('===== Error counting full translations =====');
					console.error(err);
					return done();
				}

				student.totalFullTranslations = count;

				return done();

			});

		},

		function(done) {

			keystone.list('Translation').model.count({ authors: student.id }).where('multipleAuthors', true).exec(function(err, count) {

				if (err) {
					console.error('===== Error counting partial translations =====');
					console.error(err);
					return done();
				}

				student.totalPartialTranslations = count;

				return done();

			});

		},

		function(done) {

			keystone.list('Translation').model.count({ authors: student.id }).exec(function(err, count) {

				if (err) {
					console.error('===== Error counting user translations =====');
					console.error(err);
					return done();
				}

				student.translationCount = count;

				return done();

			});

		},

		function(done) {

			keystone.list('Translation').model.count({ editor: student.id }).exec(function(err, count) {

				if (err) {
					console.error('===== Error counting user edits =====');
					console.error(err);
					return done();
				}

				student.editedCount = count;

				return done();

			});

		},

		function(done) {

			keystone.list('Translation').model.findOne().where('authors').in([student.id]).sort('-when').exec(function(err, translation) {

				if (err) {
					console.error("===== Error setting user last translation date =====");
					console.error(err);
					return done();
				}

				if (!translation) return done();

				student.lastTranslation = translation.when;

				return done();

			});

		}

	], next);

});


/**
 * Relationships
 */

Student.relationship({ path: 'translations', ref: 'Translation', refPath: 'authors',  });



Student.schema.virtual('name.initials').get(function() {
  return this.name.first.charAt(0) + this.name.last.charAt(0);
});

Student.schema.virtual('score').get(function() {
  if (this.totalPartialTranslations) return this.totalFullTranslations + this.totalPartialTranslations * 0.5;

  if (this.totalFullTranslations) return this.totalFullTranslations;

  return 0;
});

// Methods
// ------------------------------

Student.schema.methods.refreshTranslations = function(callback) {

	var student = this;

	student.save(callback);

}

Student.defaultSort = 'name.last';
Student.defaultColumns = 'name, matricola, translationCount, lastTranslation';
Student.register();
