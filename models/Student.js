var keystone = require('keystone'),
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
  matricola: { type: Types.Number, required: true, initial: true, format: false , note: "99999 for untranslated"},

	totalFullTranslations: { type: Number, noedit: true, label: "Full Translations" },
  totalPartialTranslations: { type: Number, noedit: true, label: "Shared Translations" },
});

/**
 * Relationships
 */

Student.relationship({ path: 'translations', ref: 'Translation', refPath: 'author',  });



Student.schema.virtual('name.initials').get(function() {
  return this.name.first.charAt(0) + this.name.last.charAt(0);
});

Student.schema.virtual('totalTranslations').get(function() {
  if ((this.totalPartialTranslations) && (this.totalFullTranslations))
    return this.totalPartialTranslations + this.totalFullTranslations;

  if (this.totalPartialTranslations)
    return this.totalPartialTranslations;

  if (this.totalFullTranslations)
    return this.totalFullTranslations;

  return 0;
});

Student.schema.virtual('score').get(function() {
  if (this.totalPartialTranslations) return this.totalFullTranslations + this.totalPartialTranslations * 0.5;

  if (this.totalFullTranslations) return this.totalFullTranslations;

  return 0;
});

Student.schema.virtual('isTeacher').get(function() {
  return this.matricola == 99999;
});

// Methods
// ------------------------------

Student.schema.methods.refreshTranslations = function(callback) {

	var student = this;

	keystone.list('Translation').model.count()
		.where('author').in([student.id])
		.where('partial', false)
		.exec(function(err, count) {

			if (err) return callback(err);

			student.totalFullTranslations = count;
			student.save(callback);

		});

  keystone.list('Translation').model.count()
    .where('author').in([student.id])
    .where('partial', true)
    .exec(function(err, count) {

      if (err) return callback(err);

      student.totalPartialTranslations = count;
      student.save(callback);

    });

}

Student.defaultColumns = 'name, matricola, totalFullTranslations, totalPartialTranslations';
Student.defaultSort = 'name.last';
Student.register();
