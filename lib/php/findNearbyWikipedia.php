<?php
	/** */
	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$url='http://api.geonames.org/findNearbyWikipediaJSON?lat='.$_REQUEST['lat'].'&lng='.$_REQUEST['lng'] .'&username=flightltd';

	// echo json_encode($url)

	/**Setting up curl Command*/ 
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);
	$result=curl_exec($ch);
	curl_close($ch);

    /**Display curl Command result*/ 
	echo $result

?>