var keystone = require('keystone'),
  Types = keystone.Field.Types;

/**
 * Translation Model
 * =============
 */

var Translation = new keystone.List('Translation', {
  track: true,
});

Translation.add({
  when: { type: Types.Date, default: Date.now, initial: true },
  author: { type: Types.Relationship, ref: 'Student', initial: true, index: true  },

	partial: { type: Types.Boolean, default: false, index: true, initial: true },
});

/**
 * Hooks
 * =====
 */

Translation.schema.post('save', function() {
	keystone.list('Student').model.findById(this.author, function(err, student) {
		if (student) student.refreshTranslations();
	});
});
Translation.schema.post('remove', function() {
	keystone.list('Student').model.findById(this.author, function(err, student) {
		if (student) student.refreshTranslations();
	});
})

/**
 * Registration
 * ============
 */

Translation.defaultSort = '-when';
Translation.defaultColumns = 'when, fullCount, partial, author';
Translation.register();
