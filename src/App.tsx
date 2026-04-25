import { useState, useEffect } from 'react'
import './App.css'
import Navbar from './components/Navbar.tsx';

function App() {
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [midiMessage, setMIDIMessage] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  //all 12 notes of scale
  const notes = ["C", "C#", "D", "E♭", "E", "F", "F#", "G", "A♭", "A", "B♭", "B"];
  useEffect(() => {
      //Requesting access to any input that the browser detects
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess()
            .then(success, failure);
    }

    // 'midi' displays a MIDIAccess object, the key to recieving midi data
    // The object itself provides an interface to any MIDI devices attached
    function success (midi: MIDIAccess) {
      const updateStatus = () => {
        if (midi.inputs.size < 1) {
          setMIDIMessage("No MIDI device connected");
          setConnected(false);
        } else {
          setMIDIMessage("MIDI Device Connected");
          setConnected(true);
        }
      }

      //Scan for devices immediately
      updateStatus();

      //Also scan and update status whenever a new device is connected
      midi.onstatechange = () => {
        updateStatus();
      }

      var inputs = midi.inputs.values();

      // inputs is an Iterator 
      for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
          // each time there is a midi message call the onMIDIMessage function 
          input.value.onmidimessage = onMIDIMessage;
      }
      console.log('MIDI connected');
    }

    function failure () {
        console.log('No access to your midi devices.');
    }
    
    function onMIDIMessage(message: MIDIMessageEvent) {
      const [status, note, velocity] = message.data!; //! means it is definitely not null

      if (status >=240) return; //stops console from logging messages like 254 (sent regularly by keyboard to let browser know its still connected)

      // Example: Detect note on (status 144) and note off (status 128)
      // Note ON
      if (status === 144 && velocity > 0) {
          setActiveNotes(prev => {
              if (prev.includes(note)) return prev; // avoid duplicates
              return [...prev, note];
          });
      }

      // Note OFF
      if (status === 128 || (status === 144 && velocity === 0)) {
          setActiveNotes(prev => prev.filter(n => n !== note));
      }
    }
  }, []);

  type ChordType = 
    | "major"
    | "minor"
    | "dim"
    | "aug"
    | "maj7"
    | "min7"
    | "aug7"
    | "7"
    | "dim7"
    | "halfdim7"
    | "minMaj7";

  type Chord = {
    name: string;
    notes: string[];
  }

  const chordTypes: Record<ChordType, number[]> = {
    major: [0, 4, 7],
    minor: [0, 3, 7], 
    dim: [0, 3, 6],
    aug: [0, 4, 8],
    maj7: [0, 4, 7, 11], 
    min7: [0, 3, 7, 10], 
    aug7: [0, 4, 8, 10], 
    "7": [0, 4, 7, 10], 
    dim7: [0, 3, 6, 9], 
    halfdim7: [0, 3, 6, 10],
    minMaj7: [0, 3, 7, 11]
  };

  

  //Build a chord from a root note (from notes array) and type (from chordTypes)
  function getChord(root: string, type: ChordType) : string[] {
    // Find the index of the root note
    const rootIndex = notes.indexOf(root);

    // Create the chord notes using the intervals
    return chordTypes[type].map((interval:number) => {
      // Add interval and wrap around if needed
      // Wrap around to keep midi notes above 12 in the same octave
      const index = (rootIndex + interval) % 12;

      // Return the note at that position
      return notes[index];
    });
  }
  // Generate a random chord (this is what will be displayed)
  function getRandomChord(): Chord {
    // Pick a random root note
    const root = notes[Math.floor(Math.random() * notes.length)];

    // Randomly pick a chord type
    function getRandomChordType(): ChordType{
      const types = Array.from(selectedChords);
      return types[Math.floor(Math.random() * types.length)]; //e.g. types[Math.floor(0.34 * 10)] = types[3] = aug
    }

    const type: ChordType = getRandomChordType();
    return {
      name: `${root} ${type}`,     // e.g. "E minor"
      notes: getChord(root, type) // e.g. ["E", "G", "B"]
    };
  }

  // Store the current chord
  const [chord, setChord] = useState<Chord | null>(null);

  //Controls the countdown timer
  const [running, setRunning] = useState(false);


  //timer value after which a new chord is generated
  const [selectedNumber, setSelectedNumber] = useState("5");
  const [countdownNumber, setCountdownNumber] = useState(Number(selectedNumber)); // to show time left

  const [selectedChords, setSelectedChords] = useState<Set<ChordType>>(
    new Set(Object.keys(chordTypes) as ChordType[])
  )

  // Modifying chords selected when user selects/deselects a chord
  function toggleChord(chord: ChordType) {
    setSelectedChords(prev => {
        const newSet = new Set(prev);
        if (newSet.has(chord)) {
          newSet.delete(chord);
        } else {
          newSet.add(chord);
        }
      return newSet;
    });
  }

  //Handling countdown
  useEffect(() => {
    if (!running) return;

    // Reset countdown for new chord
    setCountdownNumber(Number(selectedNumber));

    const interval = setInterval(() => {
      setCountdownNumber(prev => {
        if (prev <= 0) {
          generateChord();
          return Number(selectedNumber);
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, [running, selectedNumber, chord]); // include chord so new chord restarts countdown

  //Generating result message for either pass or fail
  const [resultMessage, setResultMessage] = useState<string>("");

  const playedNoteNames = activeNotes.map(n => notes[n % 12]);
  const uniquePlayed = [...new Set(playedNoteNames)].sort();
  
  useEffect(() => {
    if (!chord || resultMessage) return; // skip if a resultMessage already has a value and is thus being displayed on screen

    const expected = [...chord.notes].sort();
    const isMatch =
      expected.length === uniquePlayed.length &&
      expected.every((n, i) => n === uniquePlayed[i]);

    if (isMatch) {
      setResultMessage("Correct!");
      //Pause timer
      setRunning(false);
      //Wait 3 seconds before generating new chord
      setTimeout(generateChord, 3000);

      return;
    } else if (!isMatch && countdownNumber === 0){
      setResultMessage("Incorrect.");
    }
  }, [playedNoteNames, chord]);

  // Create a new random chord
  function generateChord() {
    setChord(getRandomChord());
    setCountdownNumber(Number(selectedNumber));
    setRunning(true);

    setResultMessage("");
  }
  return (
    <>
      <Navbar/>
      <div>
        <h1>Chord</h1>

        {/* Show chord name */}
        <p className='chordName'>
          {Array.from(selectedChords).length <= 0 ? "No Chord Types Selected" : chord ? chord.name : "Press Start"}
        </p>

        {connected && <p>Notes you are playing: [ {uniquePlayed} ]</p>}


        {connected && <h2>{resultMessage}</h2>}

        <h1></h1>

        <h3>Time left: {countdownNumber}</h3>

        <h2>Set time:</h2>
        <select 
          value={selectedNumber}
          onChange={(e) => setSelectedNumber(e.target.value)}
        >
          {[...Array(60).keys()].map(i => (
            <option key={i + 1} value={(i + 1).toString()}>{i + 1}</option>
          ))}
        </select>

        <p>Selected time: {selectedNumber} seconds</p>
        {/* Button to get a new chord */}
        <button className={running ? "finishButton" : "startButton"} onClick={() => {
          if (running) {
            setRunning(false);
          } else {
            generateChord();
          }
        }}>

          {running? "Finish" : "Start"}
        </button>
        <p><i className="fa-solid fa-circle-info"></i> {midiMessage}</p>

        {/*Checkbox list - allows users to choose what chords they want to be tested on */}
        {(Object.keys(chordTypes) as ChordType[]).map(c => (
          <>
            <input type="checkbox" 
              name={c} 
              value={c} 
              id={c} 
              checked={selectedChords.has(c)} 
              onChange={() => toggleChord(c)}
            />
            <label htmlFor={c}>{c}</label>
          </>
        ))}
      </div>
    </>
  )
}

export default App
