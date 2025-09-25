
export interface SavedLocations {
	locations: string[];
}

export interface UserPreferences {
	selectedLocation: string;
	units: 'metric' | 'imperial';
	theme: 'light' | 'dark';
}
