
export interface Coordinates {
	latitude: number;
	longitude: number;
}

export interface GeolocationPosition {
	coords: Coordinates;
	timestamp: number;
}

export interface GeolocationError {
	code: number;
	message: string;
}
