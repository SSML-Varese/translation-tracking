var keystone = require('keystone'),
    Student = keystone.list('Student'),
    Translation = keystone.list('Translation');

var Slack = require('node-slack');
var slack = new Slack(process.env.SLACK_DOMAIN,process.env.SLACK_TOKEN);

exports = module.exports = function(req, res) {

    /*slack.send({
        text: 'Howdy!',
        channel: '#random',
        username: 'Bot'
    });*/

    //Student.model.find().

    var reply = slack.respond(req.body,function(hook) {

      var arr = hook.text.split(" ");

      if ((arr[0].toLowerCase() == "translation") || (arr[0].toLowerCase() == "partial")) {

        var identifier = arr.slice(2).join(" ");

        var isName = true;
        var query = 'name.first';

        if (/^[1-9]\d*$/.test(identifier)) {
          isName = false;
          query = 'matricola';
        }

        Student.model.find()
          .where(query, identifier)
          .limit(5)
          .exec().then( function(students) {

            if (students.length == 0) {

              res.json({
                text: "I'm sorry " + hook.user_name +
                  ", but I couldn't find any student" +
                  ((isName == true) ? " named " : " with matricola ") +
                  identifier
              });

            } else if (students.length > 1) {

              //console.log("Multiple students were found.");
              //console.log(students);

              var responseText = "I'm sorry " + hook.user_name + ", but I found multiple students, please specify one of the following matricola: ";

              var arrayLength = students.length;
              for (var i = 0; i < arrayLength; i++) {
                responseText = responseText + students[i].name.first + " " + students[i].name.last + " (" + students[i].matricola + "), ";
              }

              res.json({
                text: responseText
              });

            } else { // there is only one student

              //console.log("A student was found (" + students[0].matricola + ")");

              var newTranslation = new Translation.model({
                author: students[0],
                when: Date.now(),
                partial: ((arr[0].toLowerCase() == "translation") ? false : true),
              });
            }

            newTranslation.save(function(err) {

              if (err) {

                console.log("Couldn't save");
                console.log(err);

                res.json({
                  text: "I'm sorry " + hook.user_name +
                    ", but something went wrong: " + err
                });

              } else {

                res.json({
                  text: "I'm happy " + hook.user_name +
                    ", to hear that " + students[0].name.first + " " +
                    students[0].name.last + " (" + students[0].matricola +
                    ") translated an article" +
                    ((newTranslation.partial == true) ? " with someone else" : "")
                });

              }
            });

          }, function(err) {

            if (err) {

              console.log(err);

              res.json({
                text: "I'm sorry " + hook.user_name +
                  ", but something went wrong: " + err
              });

            } else {

              res.json({
                text: "I'm sorry " + hook.user_name +
                ", but something might have gone wrong."
              });

            }

          });
      } else {

        res.json({
          text: "I don't know what you are talking about, " + hook.user_name
        });

      }
    });

    //res.json(reply);

}
