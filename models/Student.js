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

	totalFullTranslations: { type: Number, noedit: true },
  totalPartialTranslations: { type: Number, noedit: true },
});

/**
 * Relationships
 */

Student.relationship({ ref: 'Translation', path: 'author' });

Student.schema.virtual('name.initials').get(function() {
  return this.name.first.charAt(0) + this.name.last.charAt(0);
});

Student.schema.virtual('totalTranslations').get(function() {
  return this.totalPartialTranslations + this.totalFullTranslations;
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

Student.defaultSort = '+name.last'; // doesn't work
Student.defaultColumns = 'name, name.initials, totalFullTranslations, totalPartialTranslations';
Student.register();
