var keystone = require('keystone');

var Student = keystone.list('Student');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'members';

	view.query('students', Student.model.find().sort('matricola'));

	view.render('students');
}
