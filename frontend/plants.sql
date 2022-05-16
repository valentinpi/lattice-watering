CREATE TABLE `plants` (
	`plant_pseudo_id` int(11) NOT NULL,
	`plant_lib_id` int(11),
	`plant_name` varchar(255) NOT NULL,
	`temp` int(11),
	`hum` int(11)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

ALTER TABLE `plants`
	ADD PRIMARY KEY (`plant_pseudo_id`),
	ADD KEY `plant_name` (`plant_name`);

ALTER TABLE `plants`
	MODIFY `plant_pseudo_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

INSERT INTO `plants` (`plant_id`, `plant_name`) VALUES
	(0, 'plant_name', 0, 0);