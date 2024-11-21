# Train Delay Checker Project Prompt

## Project Overview
A React TypeScript application that checks and displays train delays in Sweden using the Trafikverket API.

## Core Features
1. Station search with autocomplete
2. Real-time delay information
3. Delay categorization (small, medium, severe)
4. Station name caching
5. Filtering capabilities

## Technical Requirements

### API Integration
- Endpoint: https://api.trafikinfo.trafikverket.se/v2/data.json
- Authentication Key: [HIDDEN]
- Schema Version: 1.9 for TrainAnnouncement, 1.4 for TrainStation

### Data Structures
1. Train Announcements
   - Departure information
   - Delay calculations
   - Station mappings

2. Station Information
   - Location signatures
   - Official names
   - Local caching

### User Interface
1. Search Input
   - Autocomplete from cached stations
   - Support for both station codes and names
   - Minimum 2 characters for search

2. Delay Display
   - Color coding:
     - Small delays (≤5min): Cyan
     - Medium delays (6-19min): Yellow
     - Severe delays (≥20min): Red with animation
   - Time information display
   - From/To station information

3. Filter Controls
   - All delays
   - Small delays
   - Medium delays
   - Severe delays
   - Count badges for each category

### Technical Specifications

#### Station Data Caching