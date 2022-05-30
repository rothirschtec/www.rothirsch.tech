<?php
  $data = $_POST['key'];
  $analyze_file = $_POST['analyze_file'];
  $myfile = fopen($analyze_file, "a") or die("Unable to open file!");
  fwrite($myfile, $data ."\n");
  fclose($myfile);
  echo $data;
?>
