var keystone = require('keystone'),
    Student = keystone.list('Student'),
    Translation = keystone.list('Translation');

var Slack = require('node-slack');
var slack = new Slack(process.env.DOMAIN,process.env.TOKEN);

exports = module.exports = function(req, res) {

    /*slack.send({
        text: 'Howdy!',
        channel: '#random',
        username: 'Bot'
    });*/

    //Student.model.find().

    var reply = slack.respond(req.body,function(hook) {

      var arr = hook.text.split(" ");

      if ((arr[0].toLowerCase() == "translation") || (arr[0].toLowerCase() == "shared")) {

        var name = arr.slice(2).join(" ");
        console.log(name);

        Student.model.findOne()
          .where('name.first', name)
          .exec().then( function(student) {

            if (!student) {
              res.json({
                text: "I'm sorry " + hook.user_name + ", but I couldn't find any student named " + name,
                username: "Bot"
              });
            } else {
              console.log("student found");

              var newTranslation = new Translation.model({
                author: student,
                when: Date.now(),
                partial: (arr[0].toLowerCase() == "translation") ? false : true,
              });

              newTranslation.save(function(err) {
                if (err) {
                  console.log("couldn't save");
                  console.log(err);
                  res.json({
                    text: "I'm sorry " + hook.user_name + ", but something went wrong: " + err,
                    username: 'Bot'
                  });
                } else {
                  res.json({
                    text: "I'm happy " + hook.user_name + ", to hear that " + student.name.first + " " + student.name.last + " (" + student.matricola + ") translated an article",
                    username: "Bot"
                  });
                }
              });

            }
          }, function(err) {
            if (err) {
              console.log(err);
              res.json({
                text: "I'm sorry " + hook.user_name + ", but something went wrong: " + err,
                username: 'Bot'
              });
            }
          });
      } else {
        res.json({
          text: "I don't know what you are talking about, " + hook.user_name,
          username: 'Bot'
        });
      }
    });

    //res.json(reply);

}
