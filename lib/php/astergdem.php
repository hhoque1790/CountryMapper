<?php
	/** */
	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$url='http://api.geonames.org/astergdemJSON?formatted=true&lat='. $_REQUEST['lat'].'&lng='.$_REQUEST['lng'] . '&username=flightltd&style=full';

	// echo json_encode($url)

	/**Setting up curl Command*/ 
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);
	$result=curl_exec($ch);
	curl_close($ch);

	// echo json_encode($result)

	/**Processing result */
	$decode = json_decode($result,true);
	$output['data'] = $decode['astergdem'];
	header('Content-Type: application/json; charset=UTF-8');
	
	echo json_encode($output);
?>
