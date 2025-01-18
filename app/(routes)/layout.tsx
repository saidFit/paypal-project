import * as React from 'react';

interface ILayoutProps {
    children : React.ReactNode
}

const layout: React.FunctionComponent<ILayoutProps> = ({children}) => {
  return(
    <div>
        {children}
    </div>
  );
};

export default layout;
