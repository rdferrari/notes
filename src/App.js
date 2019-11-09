import React, { Component } from "react";
import { withAuthenticator } from "aws-amplify-react";
import { API, graphqlOperation } from "aws-amplify";
import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote
} from "./graphql/subscriptions";

class App extends Component {
  state = {
    id: "",
    note: "",
    notes: []
  };

  async componentDidMount() {
    this.getNotes();
    this.createNoteListener = API.graphql(
      graphqlOperation(onCreateNote)
    ).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote;
        const prevNotes = this.state.notes.filter(
          note => note.id !== newNote.id
        );
        const updatedNotes = [...prevNotes, newNote];
        this.setState({ notes: updatedNotes });
      }
    });
    this.deleteNoteListener = API.graphql(
      graphqlOperation(onDeleteNote)
    ).subscribe({
      next: noteData => {
        const deletedNote = noteData.value.data.onDeleteNote;
        const updatedNotes = this.state.notes.filter(
          note => note.id !== deletedNote.id
        );
        this.setState({ notes: updatedNotes });
      }
    });
    this.onUpdateNoteListener = API.graphql(
      graphqlOperation(onUpdateNote)
    ).subscribe({
      next: noteData => {
        const { notes } = this.state;
        const updatedNote = noteData.value.data.onUpdateNote;
        const index = notes.findIndex(note => note.id === updatedNote.id);
        const updatedNotes = [
          ...notes.slice(0, index),
          updatedNote,
          ...notes.slice(index + 1)
        ];
        this.setState({ notes: updatedNotes, note: "", id: "" });
      }
    });
  }

  componentWillUnmount() {
    this.createNote.unsubscribe();
  }

  getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    this.setState({ notes: result.data.listNotes.items });
  };

  hasExistingNote = () => {
    const { notes, id } = this.state;
    if (id) {
      const isNote = notes.findIndex(note => note.id === id) > -1;
      return isNote;
    }
    return false;
  };

  handleChangeNote = event => this.setState({ note: event.target.value });

  handleAddNote = async event => {
    const { note } = this.state;
    event.preventDefault();

    if (this.hasExistingNote()) {
      this.handleUpddateNote();
    } else {
      // note: note and input: input ES6
      const input = { note };
      await API.graphql(graphqlOperation(createNote, { input }));

      // const newNote = result.data.createNote;
      // const updatedNotes = [newNote, ...notes];
      this.setState({ note: "" });
    }
  };

  handleUpddateNote = async () => {
    const { id, note } = this.state;
    const input = { id, note };
    await API.graphql(graphqlOperation(updateNote, { input }));
    // const updatedNote = result.data.updateNote;
    // const index = notes.findIndex(note => note.id === updatedNote.id);
    // const updatedNotes = [
    //   ...notes.slice(0, index),
    //   updatedNote,
    //   ...notes.slice(index + 1)
    // ];
    // this.setState({ notes: updatedNotes, note: "", id: "" });
  };

  handleDeleteNote = async noteId => {
    // const { notes } = this.state;
    const input = { id: noteId };
    await API.graphql(graphqlOperation(deleteNote, { input }));
    // const deletedNoteId = result.data.deleteNote.id;
    // const updatedNotes = notes.filter(note => note.id !== deletedNoteId);
    // this.setState({ notes: updatedNotes });
  };

  // note argument destructured = ({note, id})
  handleSetNote = ({ note, id }) => this.setState({ note, id });

  render() {
    // console.log(createNote);
    const { id, notes, note } = this.state;
    return (
      <div>
        <h1>Note Taker</h1>
        <form onSubmit={this.handleAddNote}>
          <input
            placeholder="new note"
            onChange={this.handleChangeNote}
            value={note}
          ></input>
          <button type="submit">{id ? "Update Note" : "Add Note"}</button>
        </form>

        {notes.map(note => (
          <div key={note.id}>
            <li onClick={() => this.handleSetNote(note)}>{note.note}</li>
            <button onClick={() => this.handleDeleteNote(note.id)}>
              delete
            </button>
          </div>
        ))}
      </div>
    );
  }
}

export default withAuthenticator(App, { includeGreetings: true });
