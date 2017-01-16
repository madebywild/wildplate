import React from 'react';
import Helmet from 'react-helmet';

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
      <div>Hello World!</div>
    </div>
  );
}

export default App;