var keystone = require('keystone'),
	moment = require('moment'),
	async = require('async');

exports = module.exports = function(done) {

	keystone.list('Student').model.find().exec(function(err, students) {
		async.each(students, function(student, doneStudent) {

			student.set({
				canTranslateArticles: true,
        canEditArticles: ( student.matricola == 99999 ? true : false )
			}).save(function(err) {
				return doneStudent();
			});
		}, function(err) {
			return done();
		});
	});

	keystone.list('Translation').model.find().exec(function(err, translations) {
		async.each(translations, function(translation, doneTranslation) {

			translation.set({
				multipleAuthors: translation.partial, // this doesn't appear to work though, because of 'noedit'
        authors: [translation.author]
			}).save(function(err) {
				return doneTranslation();
			});
		}, function(err) {
			return done();
		});
	});

};
