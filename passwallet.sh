#!/bin/bash

# Do you think writing that in Bash is masochism? Well, yes.

osname="$(uname)";
cpwd="$(pwd)";

IS_WINDOWS=false;

case "$osname" in
	Linux) IS_WINDOWS="false" ;;
	Darwin) IS_WINDOWS="false" ;; ## never ported for Macos, it shouldn't work well, install Linux on your mac dude.
	*) IS_WINDOWS="true" ;;
esac

DIALOG="dialog"
if [ "$IS_WINDOWS" == "true" ]; then
	echo "Setting up Windows env";
	
	DIALOG="$cpwd/.win-dep/dialog.exe"
	
	function jq {
		"$cpwd/.win-dep/jq-win32.exe" "$@"
	}
	function xdotool {
		"$cpwd/.win-dep/xdotool.exe" "$@"
	}
fi
	
function prompt_pass {
	password="$($DIALOG --title 'Password' --keep-tite --passwordbox 'Enter database password: ' 10 30 2>&1 >/dev/tty)"
	r=$?;
	
	echo $password;
	return $r;
}

function __save_code {
	char_array=($(echo "$datain" | grep -o .));
	for i in ${!char_array[@]}; do
		c="${char_array[$i]}"
		if [ "$c" == "@" ]; then
			c="at";
		fi
			echo "$c";
		sleep 0.2;
	done	
}

function get_setting {
	cat "$cpwd/settings.json" | jq -r ".[\"$1\"]";
}

# Doesn't work as well as the function that uses the clipboard but is much more secure
function write_text_using_xdotool_features {
	winid="$1";
	datain="$2";

	xdotool sleep 0.3 getwindowfocus windowfocus --sync type --delay 150 --clearmodifiers "$datain"
}

function write_text_using_clipboard {
	winid="$1";
	datain="$2";

	echo "$datain" | xclip -selection c;
	xdotool keydown Ctrl sleep 0.3 key v sleep 0.3 keyup Ctrl;
}

function start_wow_unix {
	email=$1;
	pass=$2;
	opwd=$(pwd);

	cd "$(get_setting path_linux)";
	wine ./WowClassic.exe 2> $opwd/.wine_stderr.log & wowpid=$!;

	winid="";
	
	window_is_not_open=true;
	while $window_is_not_open; do
		sleep 0.5;
		winid=$(xdotool search --pid "$wowpid" | sed -n 3p);
		xprop -id $winid 2> /dev/null > /dev/null;
		[ $? -eq 0 ] && window_is_not_open=false;
	done
	
	(
		sleep 2;
		write_text_using_xdotool_features "$winid" "$email";
		sleep 0.3
		xdotool key --clearmodifiers "Tab";
		sleep 0.3
		write_text_using_xdotool_features "$winid" "$pass";
		sleep 0.3
		xdotool key --clearmodifiers "KP_Enter";
		
	) || (
		echo "Failed to find WoW Window...";
	)

	disown -h $wowpid;
}

function windows_press_spe_key {
	keys="$1";
	keys=${keys//^/'{^}'};
	keys=${keys//!/'{!}'};
	keys=${keys//+/'{+}'};
	keys=${keys//~/'{~}'};

	powershell -c '$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('"'$keys'"')'
}

function start_wow_windows {
	email=$1;
	pass=$2;

	#./WowClassic.exe & wowpid=$!;
	cmd //c start //D "$(get_setting path_windows)" WowClassic.exe
	
	sleep "$(get_setting windows_wait_time)"; #TODO: change this -- find a way to detect when WoW is opened.
	
	windows_press_spe_key "$email";
	sleep 0.3
	windows_press_spe_key "{TAB}";
	sleep 0.3
	windows_press_spe_key "$pass";
	sleep 0.3
	windows_press_spe_key "{ENTER}";
	
	# disown -h $wowpid
}

function start_wow {
	if [ "$IS_WINDOWS" == "true" ]; then
		start_wow_windows "$@"
	else
		start_wow_unix "$@"
	fi
}

function get_email {
	echo "$1" | jq -r ".email";
}

function get_password {
	echo "$1" | jq -r ".password";
}

function get_cred_for_account {
	db="$1";
	account_name="$(echo $2 | base64 --decode)";

	echo "$db" | jq ".[\"$account_name\"]";
}

function open_db {
	db=$(echo "$1" | 2> /dev/null openssl enc -d -aes-256-cbc -md sha256 -in .hidden_pass -pass stdin);
	r=$?;

	echo "$db";
	return $r;
}

# todo: found an other way to give the password to openssl
function save_db {
	db="$1";
	pass="$2";

	echo "$db" | 2> /dev/null openssl enc -e -aes-256-cbc -md sha256 -out .hidden_pass -pass pass:$pass;
}

function exec_string {
	bash -c "$1";

	return $?;
}

function ask_for_account {
	db="$1";
	
	non_array_accounts=$(echo "$db" | jq keys | jq -r '.[] | @base64');
	
	accounts=($non_array_accounts);

	dialog_options=$(
		for i in ${!accounts[@]}; do
			account_name="$(echo ${accounts[$i]} | base64 --decode 2> /dev/null)";
			echo -n " $(expr $i + 1) '$account_name'";
		done;
	);
	choice=$(exec_string "$DIALOG --keep-tite --title \"Accounts\" --menu \"Choose an account:\" 15 40 $(echo "$db" | jq keys | jq length) $dialog_options 2>&1 >/dev/tty");
	r=$?;

	echo "$(echo ${accounts[$(expr $choice - 1)]})"
	return $r;
}

function get_pass {
	db=$(open_db $1);

	if [ ! $? -eq 0 ]; then
		>&2 echo BAD PASSWORD;
		return -2;
	fi

	account_name_b64="$(ask_for_account "$db")";
	if [ $? -eq 0 ]; then
		account_cred=$(get_cred_for_account "$db" "$account_name_b64");
		echo "$account_cred";
		return 0;
	else
		>&2 echo NO ACCOUNT HAS BEEN CHOSEN;
		return -1;
	fi

}

function add_account {
	pass=$1;
	db=$(open_db $pass);

	if [ $? -eq 0 ]; then
		echo -n "Account name: ";
		read name;

		echo -n "email: ";
		read email;

		echo -n "password: ";
		read -s account_pass;
		echo;

		db=$(echo "$db" | jq ". += { \"$name\": { \"email\": \"$email\", \"password\": \"$account_pass\" } }")
		save_db "$db" "$pass";
	else
		echo BAD PASSWORD;
		exit -1;
	fi
}

function run {
	pass=$1;
	cred=$(get_pass "$pass");
	res=$?;
	if [ $res -eq 254 ]; then
		pass=$(prompt_pass);
		cred=$(get_pass "$pass");
		res=$?
	fi && [ $res -eq 0 ] && (
		echo "Launching World of Warcraft...";
		start_wow "$(get_email "$cred")" "$(get_password "$cred")";
		echo "done.";
	) || (
		exit -1;
	)
}

function edit {
	pass=$1;
	db=$(open_db $pass);

	if [ ! $? -eq 0 ]; then
		>&2 echo BAD PASSWORD;
		return -2;
	fi

	account_name_b64=$(ask_for_account "$db");

	if [ $? -eq 0 ]; then
		cred=$(get_cred_for_account "$db" "$account_name_b64");
		account_name="$(echo $account_name_b64 | base64 --decode)";
		
		echo -n "Account name ($account_name): ";
		read name;
		if [ "$name" == "" ]; then name="$account_name" ; fi;

		echo -n "email ("$(get_email "$cred")"): ";
		read email;
		if [ "$email" == "" ]; then email=$(get_email "$cred"); fi;

		echo -n "password ('unchanged if nothing is given'): ";
		read -s account_pass;
		if [ "$account_pass" == "" ]; then account_pass=$(get_password "$cred"); fi;
		echo;

		db=$(echo "$db" | jq "del(.[\"$account_name\"])");
		db=$(echo "$db" | jq ". += { \"$name\": { \"email\": \"$email\", \"password\": \"$account_pass\" } }")

		save_db "$db" "$pass";

		return 0;
	else
		>&2 echo NO ACCOUNT HAS BEEN CHOSEN;
		return -1;
	fi
}

function show {
	open_db $1 | jq;
	
	if [ "$IS_WINDOWS" == "true" ]; then
		echo "Type Enter to continue"; read;
	fi
}

function delete {
	pass=$1;
	db=$(open_db $pass);

	if [ ! $? -eq 0 ]; then
		>&2 echo BAD PASSWORD;
		return -2;
	fi

	account_name_b64=$(ask_for_account "$db");
	account_name="$(echo $account_name_b64 | base64 --decode)";

	if [ $? -eq 0 ]; then
		db=$(echo "$db" | jq "del(.[\"$account_name\"])");

		echo 'Do you really want to delete "'$account_name'" entry ?? (Y/n)'
		read r;

		char_array=($(echo "$r" | grep -o .));
		c="${char_array[$i]}";

		if [ "$c" == "n" ] || [ "$c" == "N" ]; then
			return 0;
		fi

		save_db "$db" "$pass";
		return 0;
	else
		>&2 echo NO ACCOUNT HAS BEEN CHOSEN;
		return -1;
	fi
}

# Yes, you can throw up...
function check_password {
	open_db "$1" > /dev/null;
	
	if [ $? -eq 0 ]; then echo "true"; else echo "false"; fi;
}

if [ "$command" == '-h' ]; then
	echo "usage: $0 [ add | run | edit | show | delete ]"
	exit 0;
fi

pass="";
if [ ! -f .hidden_pass ]; then
	echo -n 'Init database ~ Choose a password: ';
	read -s pass;
	echo;
	echo -n 'Confirm password: '
	read -s pass_conf;
	echo;

	if [ "$pass" == "$pass_conf" ]; then
		save_db "{}" "$pass"
	else
		echo "Passwords aren't identical."
		exit -1;
	fi
else
	pass="$(prompt_pass)";
	
	if [ ! $? -eq 0 ]; then
		echo "Aborted";
		exit 1;
	fi;
	
	pass_ok=$(check_password "$pass");
	
	if [ "$pass_ok" == "false" ]; then
		echo "Cannot open database: BAD PASSWORD";
		echo "Type Enter to exit"; read;
		exit -1;
	fi
fi

function main {
	command="$1";
	is_loop="false";

	if [ "$command" == "" ]; then
	is_loop="true";
		# echo "Enter a command [ add | run | edit | show | delete | exit ]"
		# read cmd;
		
		cmd="$($DIALOG --keep-tite --title 'Menu' --menu 'Choose an action: ' 15 40 5 1 add 2 run 3 edit 4 show 5 delete 6 exit 2>&1 >/dev/tty)"
		
		if [ -z "$cmd" ]; then
			echo "please enter a command listed below...";
			sleep 1;
			main "";
		fi
		
		case "$cmd" in
			1) command="add" ;;
			2) command="run" ;;
			3) command="edit" ;;
			4) command="show" ;;
			5) command="delete" ;;
			6) command="exit" ;;
			*) command="Invalid command" ;;
		esac
		
		if [ "$command" == "exit" ]; then
			echo 'Good bye <3';
			return 0;
		fi;
	fi

	case "$command" in
		add) add_account "$pass" ;;
		run) run "$pass" ;;
		edit) edit "$pass" ;;
		show) show "$pass" ;;
		delete) delete "$pass" ;;
		*) echo "Invalid command" ;;
	esac
	
	if [ "$is_loop" == "true" ]; then
		main "$1"; # I know, I know, why using recusive here ? Hummmm ... I agree, it's stupid.
	fi
}

main "$1";



