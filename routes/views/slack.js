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

        identifier = identifier.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
      
        var isName = true;

        var query = { $or: [{"name.first": identifier}, {"name.last": identifier}] };

        if (/\s/.test(identifier)) {
          var parts = identifier.split(" ");
          var lastName = parts.pop();
          var firstName = parts.join(" ");

          query = {$and: [{'name.first': firstName}, {'name.last': lastName}] };
        }

        if (/^[1-9]\d*$/.test(identifier)) {
          isName = false;
          query = { "matricola": identifier };
        }

        Student.model.find(query)
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

              var responseText = hook.user_name + ", can you be more specific please and try again with the full name or matricola: ";

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
                  text: "Thanks " + hook.user_name +
                    ", I have noted down that " + students[0].name.first + " " +
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
