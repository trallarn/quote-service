
module.exports = UserService;

function UserService() {
}

UserService.prototype = {

    getUsername: function(req) {
        return req.cookies.username;
    },

    isLoggedIn: function(req) {
        console.dir(req.cookies);
        console.log('username: ' + req.cookies.username);
        return !!req.cookies.username;
    },

    login: function(res, username) {
        if(!username) {
            console.log('Login failed');
            return false;
        }

        res.cookie('username', username);
        return true;
    }

};
