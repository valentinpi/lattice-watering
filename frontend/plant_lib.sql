CREATE TABLE `plant_lib` (
	`plant_id` int(11) NOT NULL,
	`plant_name` varchar(255) NOT NULL,
	`pref_temp` int(11),
	`pref_hum` int(11)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

ALTER TABLE `plants`
	ADD PRIMARY KEY (`plant_id`),
	ADD KEY `plant_name` (`plant_name`);

ALTER TABLE `plants`
	MODIFY `plant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

INSERT INTO `plants` (`plant_id`, `plant_name`) VALUES
	(1, 'Tomato', 22, 80),
	(2, 'Rosen', 20, 60),
	(3, 'Geranien', 21, 61),
	(4, 'Tulpen', 22, 62);