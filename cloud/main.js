var md5 = require("./md5.js");
var domain = 'www.bunoapp.com';
var api_key = 'key-a70011c0cdb829d3431bd7c044d6c7c4';
var Mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});;
var pass;
var Jimp = require("jimp");

Parse.Cloud.define("AuthenticateGoogleSignIn", function(request, response) {


    var query = new Parse.Query(Parse.User);
    query.equalTo("email", request.params.email);
    query.first({ useMasterKey: true,
        success: function(user) {
            // Use user..getSessionToken() to get a session token
            if (user != null) {
                if (user.get("googleIdToken") == null) {
                    user.set("googleIdToken", request.params.googleIdToken);
                    user.save(null, {
                    	success: function(user) {
                    		var email = user.getEmail();
			                var password = md5.hex_md5(user.get("md5Password"));
			                Parse.User.logIn(email, password, {
			                    success: function(user) {
			                        response.success(user.getSessionToken());
			                    },
			                    error: function(user, error) {
			                        response.error(error);
			                    }
			                });
                    	}
                    });
                } else if (user.get("googleIdToken") != request.params.googleIdToken) {
                    var error = {};
                    error.message = "Invalid Google Id";
                    response.error(error);
                } 
                
                var email = user.getEmail();
			    var password = user.get("md5Password");
			    Parse.User.logIn(email, password, {
			        success: function(user) {
			            response.success(user.getSessionToken());
			        },
			        error: function(user, error) {
			            response.error(error.message);
			        }
			    });
            } else {
                console.log("Creating New User");
                console.log(request.params.photoUrl);

                var user = new Parse.User();
                pass = generatePassword();
                var md5Password = md5.hex_md5(pass);
                user.set("username", request.params.email);
                user.set("password", md5Password);
                user.set("email", request.params.email);
                user.set("name", request.params.name);
                user.set("googleIdToken", request.params.googleIdToken);
                user.set("md5Password", md5Password);

                if(request.params.photoUrl != null) {

	               	var imageUrl = "";
	                if(request.params.photoUrl.substring(0, 4) == "http") {
	                	imageUrl = request.params.photoUrl;
	                }
	                else {
	                	imageUrl = "https://lh3.googleusercontent.com/" + request.params.photoUrl;
	                }

	                Jimp.read(imageUrl).then(function(image) {
	                	console.log(image);
	                	console.log(request.params.photoUrl);
				        var promise = new Parse.Promise();
				            image.getBuffer(Jimp.MIME_JPEG, function(err, buffer){
				                if (err) return promise.reject(err);
				                promise.resolve(buffer);
				            });
				        return promise;
				    }).then(function(buffer) {
				    	var base64 = buffer.toString("base64");
					    var picfile = new Parse.File("profile.jpg", {
					        base64: base64
					    });
			          return picfile.save();
				    }).then(function(picfile) {
					          //save the user with the pic
					        user.set("profile_image", picfile);
	                        userSignUp(user, response);
					}).then(function(result) {
						        console.log('successful save of new profile image for user: ' + user.displayname);
						    }, function(error) {
						          console.error('ran into an error: ' + error.message);
					});
               	}
               	else {
            		userSignUp(user, response);
            	}
            }

        },
        error: function(user, error) {
            response.error(error);
        }
    });
});

//var Image = require("parse-image");

Parse.Cloud.define("AuthenticateFBSignIn", function(request, response) {

    var query = new Parse.Query(Parse.User);
    query.equalTo("email", request.params.email);
    query.first({ useMasterKey: true ,
                success: function(user) {
                    if (user != null) {
                        var email = user.getEmail();
                        var password = user.get("md5Password");
                        Parse.User.logIn(email, password, {
                            success: function(user) {
                                response.success(user.getSessionToken());
                            },
                            error: function(user, error) {
                                response.error(error);
                            }
                        });
                    } else {
                        console.log("Creating New User");
                      
                        var user = new Parse.User();
                        pass = generatePassword();
                        console.log(pass);
                        var md5Password = md5.hex_md5(pass);
                        console.log(md5Password);
                        user.set("username", request.params.email);
                        user.set("password", md5Password);
                        user.set("email", request.params.email);
                        user.set("md5Password", md5Password);
                        user.set("name", request.params.name);

						Jimp.read(request.params.profile_pic).then(function(image) {
					        var promise = new Parse.Promise();
					            image.getBuffer(Jimp.MIME_JPEG, function(err, buffer){
					                if (err) return promise.reject(err);
					                promise.resolve(buffer);
					            });
					        return promise;
					    }).then(function(buffer) {
					    	var base64 = buffer.toString("base64");
						    var picfile = new Parse.File("profile.jpg", {
						        base64: base64
						    });
				          return picfile.save();
					    }).then(function(picfile) {
						          //save the user with the pic
						        user.set("profile_image", picfile);
		                        userSignUp(user, response);
						}).then(function(result) {
							        console.log('Successful save of new profile image for user: ' + user.displayname);
							    }, function(error) {
							          console.error('ran into an error: ' + error.message);
						});


                    
                    }
                },
                error: function(error) {
                	response.error(error.message);
                }
        });
});

function userSignUp(user, response) {
		console.log("User Sign UP Function");
		user.signUp(null, {
	    success: function(user) {

	    	var data = {
					  from: "Mailgun@BucketNotes.com",
					  to: user.getEmail(),
					  subject: "Buno App Password",
	            	  text: "Your password for the app is " + pass
					};
					 
			Mailgun.messages().send(data, function (error, body) {
				console.log("Mail Sent");
				console.log("User saved");
				response.success(user.getSessionToken());
			});
	    },
	    error: function(user, error) {
	        response.error(error);
	    }
	});
}

function generatePassword(){

    var keylistalpha="abcdefghijklmnopqrstuvwxyz";
    var keylistint="123456789";
    var keylistCaps="ABCDEFGHIJKLMNPQRSTUVWXYZ";
    var temp='';
    var len = 4;
    var len = len - 1;
    var lenspec = 8-len-len;

    for (i=0;i<len;i++)
        temp+=keylistalpha.charAt(Math.floor(Math.random()*keylistalpha.length));

    for (i=0;i<lenspec;i++)
        temp+=keylistCaps.charAt(Math.floor(Math.random()*keylistCaps.length));

    for (i=0;i<len;i++)
        temp+=keylistint.charAt(Math.floor(Math.random()*keylistint.length));

        temp=temp.split('').sort(function(){return 0.5-Math.random()}).join('');

    return temp;
}

Parse.Cloud.define("ChangePassMd5", function(request, response) {

    var query = new Parse.Query(Parse.User);
    query.equalTo("email", request.params.email);
    query.first({ useMasterKey: true,
        success: function(user) {
            // Use user..getSessionToken() to get a session token
            if (user != null) {
            	console.log(request.params.password);
	            user.set("md5Password", request.params.md5Password);
	            user.set("password", request.params.md5Password);
	            user.save(null, { useMasterKey: true,
					success: function (user) {
						console.log("here");
						response.success(true);
					}
				});
            }
            else {
				console.log("Here");
				response.error("No Such User Exists");
            }
        },
        error: function(user, error) {
			console.log(error);
			response.error(error);
        }
    });
});

Parse.Cloud.define("ForgotPassword", function(request, response) {

    var query = new Parse.Query(Parse.User);
    query.equalTo("email", request.params.email);
    query.first({ useMasterKey: true,
        success: function(user) {
            // Use user..getSessionToken() to get a session token
            if (user != null) {

				var data = {
					  from    : "Mailgun@BucketNotes.com",
					  to      : user.getEmail(),
					  subject : "Reset password for the account",
		              text    : "Click this link to reset your password \n" + 
		                        "www.bunoapp.com/choose_password/index.html?session=" + 
		                        md5.hex_md5(user.get("md5Password")) + 
		                        "&&username=" + user.getEmail()
					};
					 
				Mailgun.messages().send(data, function (error, body) {
		              response.success("Reset Password Email Sent")
				});

	    	}
	    },
	    error: function(user, error) {
	        response.error(error);
	    }
    });
});

Parse.Cloud.define("ValidateLink", function(request, response) {


    var query = new Parse.Query(Parse.User);
    query.equalTo("email", request.params.email);
    query.first({ useMasterKey: true,
        success: function(user) {
            
            if (user != null) {
            	var sessionCheck = md5.hex_md5(user.get("md5Password"));
            	
            	if(sessionCheck == request.params.token) {
            		response.success(true);
            	}
            	else {
            		console.log("Session key is invalid " + sessionCheck);
            		console.log("The session received from request " + request.params.token);

            		response.success(
            			{'a':false, 
            			 'b' : sessionCheck, 
            			 'c' : request.params.token
            			});
            	}
	    	}
	    	else {
	    		console.log("User is invalid");
	    		response.success({'a':false, 'b' : sessionCheck, 'c' : request.params.token});
	    	}
	    },
	    error: function(user, error) {
	        response.error(error);
	    }
    });
});

Parse.Cloud.define("SendFeedback", function(request, response) {


	var data = {
	  from: request.params.email,
	  to: "hello@bunoapp.com",
	  subject: "Feedback",
	  text: request.params.feedback
	};
	 
	Mailgun.messages().send(data, function (error, body) {
		response.success("Success")
	});

});

Parse.Cloud.define("SendPush", function(request, response) {

	var query = new Parse.Query(Parse.Installation);
    query.equalTo("user", request.user);
    query.notEqualTo("installationId", request.params.installationId)	
	console.log(request.params.installationId);

	Parse.Push.send({
	  where:  query,
	  data: { 
	  	"content-available": 1
	  }
	}, { useMasterKey: true, 
			success: function(status) {
				console.log(status);
    			response.success("true");
  			},
			error: function(error) {
			    console.log(error);
			    response.error(error);
			} 
	});
});

Parse.Cloud.define("RemoveInstallation", function(request, response) {

	var installationId = request.params.installationId;

    var query = new Parse.Query(Parse.Installation);
    query.equalTo("installationId", installationId);

    query.first({ useMasterKey : true, 
    	success: function(installations) {

    		installations.unset("user");
    		installations.save({
				useMasterKey : true,
				  success: function(myObject) {
				    response.success("Deleted");
				  },
				  error: function(myObject, error) {
				    response.success("Failed");
				  }
    		});
		},
		error: function(error) {
		    console.log("Error: " + error.code + " " + error.message);
		    response.success("Deleted");
		}
            
    });
});
