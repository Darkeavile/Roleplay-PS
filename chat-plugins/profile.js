'use strict';
/*eslint no-restricted-modules: [0]*/

let color = require('../config/color');
let moment = require('moment');
let geoip = require('geoip-ultralight');
var serverIp = 'dedicatedrpsever-lustyash.c9users.io';
var http = require('http');

let BR = '<br>';
let SPACE = '&nbsp;';
let profileColor = '#24678d';
let trainersprites = [1, 2, 101, 102, 169, 170, 265, 266, 168];

/**
 * Profile constructor.
 *
 * @param {Boolean} isOnline
 * @param {Object|String} user - if isOnline then Object else String
 * @param {String} image
 */
function Profile(isOnline, user, image) {
	this.isOnline = isOnline || false;
	this.user = user || null;
	this.image = image;

	this.username = Tools.escapeHTML(this.isOnline ? this.user.name : this.user);
	this.url = 'http://dedicatedrpsever-lustyash.c9users.io';
}

/**
 * Create an bold html tag element.
 *
 * Example:
 * createFont('Hello World!');
 * => '<b>Hello World!</b>'
 *
 * @param {String} color
 * @param {String} text
 * @return {String}
 */
function bold(text) {
	return '<b>' + text + '</b>';
}

/**
 * Create an font html tag element.
 *
 * Example:
 * createFont('Hello World!', 'blue');
 * => '<font color="blue">Hello World!</font>'
 *
 * @param {String} color
 * @param {String} text
 * @return {String}
 */
function font(color, text) {
	return '<font color="' + color + '">' + text + '</font>';
}

/**
 * Create an img tag element.
 *
 * Example:
 * createImg('phil.png');
 * => '<img src="phil.png" height="80" width="80" align="left">'
 *
 * @param {String} link
 * @return {String}
 */
function img(link) {
	return '<img src="' + link + '" height="80" width="80">';
}

/**
 * Create a font html element wrap around by a bold html element.
 * Uses to `profileColor` as a color.
 * Adds a colon at the end of the text and a SPACE at the end of the element.
 *
 * Example:
 * label('Name');
 * => '<b><font color="#24678d">Name:</font></b> '
 *
 * @param {String} text
 * @return {String}
 */
function label(text) {
	return bold(font(profileColor, text + ':')) + SPACE;
}

function currencyName(amount) {
	let name = " buck";
	return amount === 1 ? name : name + "s";
}

Profile.prototype.avatar = function () {
	if (this.isOnline) {
		if (typeof this.image === 'string') return img(this.url + ':80/avatars/' + this.image);
		return img('http://play.pokemonshowdown.com/sprites/trainers/' + this.image + '.png');
	}
	for (let name in Config.customAvatars) {
		if (this.username === name) {
			return img(this.url + ':' + Config.port + '/avatars/' + Config.customAvatars[name]);
		}
	}
	let selectedSprite = trainersprites[Math.floor(Math.random() * trainersprites.length)];
	return img('http://play.pokemonshowdown.com/sprites/trainers/' + selectedSprite + '.png');
};

Profile.prototype.buttonAvatar = function () {
	let css = 'border:none;background:none;padding:0;float:left;';
	return '<button style="' + css + '" name="parseCommand" value="/user ' + this.username + '">' + this.avatar() + "</button>";
};

Profile.prototype.group = function () {
	if (this.isOnline && this.user.group === ' ') return label('Group') + 'Regular User';
	if (this.isOnline) return label('Group') + Config.groups[this.user.group].name;
	for (let name in Users.usergroups) {
		if (toId(this.username) === name) {
			return label('Group') + Config.groups[Users.usergroups[name].charAt(0)].name;
		}
	}
	return label('Group') + 'Regular User';
};

Profile.prototype.money = function (amount) {
	return label('Money') + amount + currencyName(amount);
};

Profile.prototype.name = function () {
	return label('Name') + bold(font(color(toId(this.username)), this.username));
};

Profile.prototype.seen = function (timeAgo) {
	if (this.isOnline) return label('Last Seen') + font('#2ECC40', 'Currently Online');
	if (!timeAgo) return label('Last Seen') + 'Never';
	return label('Last Seen') + moment(timeAgo).fromNow();
};

Profile.prototype.vip = function (user) {
	if (isVip(user)) return font('#6390F0', '(<b>VIP User</b>)');
	return '';
	
};

Profile.prototype.contributor = function (user) {
	if (isCONTRIBUTOR(user)) return font('#6390F0', '(<b> Contributor </b>)');
	return '';
};

Profile.prototype.rstaff = function (user) {
	if (isRSTAFF(user)) return font('#6390F0', '(<b> Retired Staff </b>)');
	return '';
};

Profile.prototype.flag = function (user) {
	if (Users(user)) {
		let userFlag = geoip.lookupCountry(Users(user).latestIp);
		if (userFlag) {
			return '<img src="https://github.com/kevogod/cachechu/blob/master/flags/' + userFlag.toLowerCase() + '.png?raw=true" height=10 title="' + userFlag + '">';
		}
	}
	return '';
};


Profile.prototype.title = function () {
	let title = Db('TitleDB').get(toId(toId(this.user)));
	if (typeof title !== 'undefined' && title !== null)  return ' (<font color=#' + title[0] + '><b>' + Tools.escapeHTML(title[1]) + '</b></font>)';
	return '';
};

Profile.prototype.show = function (callback) {
	let userid = toId(this.username);

	return this.buttonAvatar() +
		SPACE + this.name() + this.title() + SPACE + this.flag(userid) +  BR +
		SPACE + this.group() + SPACE + this.vip(userid) + SPACE + this.contributor(userid) + SPACE + this.rstaff(userid) + BR +
		SPACE + this.money(Db('money').get(userid, 0)) + BR +
		SPACE + this.seen(Db('seen').get(userid)) +
		'<br clear="all">';
};


exports.commands = {
	profile: function (target, room, user) {
		if (!this.runBroadcast()) return;
		if (target.length >= 19) return this.sendReply("Usernames are required to be less than 19 characters long.");
		let targetUser = this.targetUserOrSelf(target);
		let profile;
		if (!targetUser) {
			profile = new Profile(false, target);
		} else {
			profile = new Profile(true, targetUser, targetUser.avatar);
		}
		this.sendReplyBox(profile.show());
	},
		customtitle: function (target, room, user) {
		let parts = target.split(',');
		let cmd = parts[0].trim().toLowerCase();
		let userid, targetUser;
		let title = [];
		switch (cmd) {
		case 'set':
			if (!this.can('lock') && !this.can('vip')) return false;
			let reg = /^\w+$/;
			userid = toId(parts[1]);
			targetUser = Users.getExact(userid);
			if (!userid) return this.sendReply("You didn't specify a user.");
			if (!Users.get(targetUser)) return this.errorReply('The target user is not online.');
			if (targetUser.length >= 19) return this.sendReply("Usernames are required to be less than 19 characters long.");
			if (targetUser.length < 3) return this.sendReply("Usernames are required to be greater than 2 characters long.");
			if (!reg.test(parts[2].trim())) return this.sendReply("Enter only alphanumeric characters for the eg. ff80b3");
			if (parts.length < 4) return this.sendReply("Invalid command. Valid commands are `/customtitle set, user, color, title`.");
			if (toId(targetUser) !== toId(user) && !this.can('lock')) return this.sendReply("You must be staff to set other people their custom title.");
			title[0] = parts[2].trim();
			title[1] = Tools.escapeHTML(parts.slice(3).join(",").trim());
			if (title[1].length > 30) return this.errorReply("Custom titles cannot be longer than 30 characters.");
			Db('TitleDB').set(toId(userid), title);
			Users.get(userid).popup('|modal||html|<font color="red"><strong>ATTENTION!</strong></font><br /> You have received a custom title from <b><font color="' + color(user.userid) + '">' + Tools.escapeHTML(user.name) + '</font></b>: ' + '<font color=' + title[0] + '> <b>' + Tools.escapeHTML(title[1]) + '</b></font>');
			this.sendReply("Usertitle set.");
			break;
		default:
			return this.sendReply("Invalid command. Valid commands are `/customtitle set, user, color, title`.");
		}
	},
	profilehelp: ["/profile -	Shows information regarding user's name, group, money, and when they were last seen."],
};
