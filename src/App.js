import { useCallback, useContext, useEffect, useState } from 'react';
import { FirebaseContext } from './contexts';
import Moment from 'react-moment';

const createRow = (onDelete, onDownload, isDownloadingId) => (doc) => {
  const { id, title, created, filesCount } = doc;

  const isDownloading = isDownloadingId === id;

  const handleDelete = () => onDelete && onDelete(doc);

  const handleDownload = () => onDownload && onDownload(doc);

  return (
    <tr key={id}>
      <td>{title}</td>
      <td>
        <Moment interval={30} fromNow={true}>
          {created.toDate()}
        </Moment>
      </td>
      <td>{filesCount}</td>
      <td>
        <ActionButtons
          isDownloading={isDownloading}
          onDelete={handleDelete}
          onDownload={handleDownload}
        />
      </td>
    </tr>
  );
};

function App() {
  const [deposits, setDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingId, setIsDownloadingId] = useState(false);
  const firebase = useContext(FirebaseContext);

  const subscriptionCallback = useCallback(
    (docs) =>
      setDeposits(
        docs.map((doc) => ({
          ...doc,
          filesCount: doc.files.length || 0,
        }))
      ),
    []
  );

  useEffect(() => {
    // noinspection UnnecessaryLocalVariableJS
    const unsubscribe = firebase.subscribeToDeposits(subscriptionCallback);

    return unsubscribe;
  }, [firebase, subscriptionCallback]);

  const handleDelete = (doc) => firebase.deleteDeposit(doc);

  const handleDownload = (doc) => {
    setIsDownloadingId(doc.id);

    return firebase.downloadFiles(doc).finally(() => setIsDownloadingId(null));
  };

  return (
    <div className={'container'}>
      <section>
        <hgroup>
          <h1>Create</h1>
          <h2>Create a new deposit.</h2>
        </hgroup>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsLoading(true);

            firebase
              .uploadDeposit(e.target.title.value, e.target.files.files)
              .then(() => {
                e.target.reset();
              })
              .catch((err) => {
                window.alert(err.message);
              })
              .finally(() => {
                setIsLoading(false);
              });
          }}
        >
          <div className={'grid'}>
            <label htmlFor={'title'}>
              <input
                id={'title'}
                name={'title'}
                type={'text'}
                placeholder={'Title'}
                required={true}
              />
              <small>Give this deposit a nice name</small>
            </label>
            <label htmlFor={'files'}>
              <input
                id={'files'}
                name={'files'}
                type={'file'}
                required={true}
                multiple={true}
              />
            </label>
          </div>
          <button aria-busy={isLoading} disabled={isLoading} type="submit">
            Submit
          </button>
          <button className={'secondary'} type="reset">
            Reset
          </button>
        </form>
      </section>
      <section>
        <hgroup>
          <h1>Download</h1>
          <h2>Download or delete any existing deposits.</h2>
        </hgroup>
        <figure>
          <table role={'grid'}>
            <thead>
              <tr>
                <th scope={'col'}>Title</th>
                <th scope={'col'}>Created</th>
                <th scope={'col'}># Files</th>
                <th scope={'col'}>Action</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map(
                createRow(handleDelete, handleDownload, isDownloadingId)
              )}
            </tbody>
          </table>
        </figure>
      </section>
    </div>
  );
}

function ActionButtons({ onDownload, onDelete, isDownloading }) {
  return (
    <div className={'button-group'}>
      <button
        onClick={onDownload}
        aria-busy={isDownloading}
        disabled={isDownloading}
      >
        Download
      </button>
      <button
        className={'secondary'}
        onClick={() => {
          const confirmation = window.confirm(
            'Are you sure you want to delete this deposit?'
          );

          if (confirmation) {
            onDelete && onDelete();
          }
        }}
      >
        Delete
      </button>
    </div>
  );
}

export default App;
