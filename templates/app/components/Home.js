import React from 'react';
import Helmet from 'react-helmet';
import styles from './Home.scss';

function App(props) {
  return (
    <div>
      <Helmet
        titleTemplate="%s - wildplate"
        defaultTitle="Home"
        meta={[
          { name: 'description', content: 'wildplate demo' },
        ]}
      />
      <div className={styles.hello}>Hello World!</div>
    </div>
  );
}

export default App;