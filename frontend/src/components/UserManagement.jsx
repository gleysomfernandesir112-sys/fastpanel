import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import MasterResellerManager from './MasterResellerManager';
import ResellerManager from './ResellerManager';
import ClientManager from './ClientManager';

const UserManagement = () => {
  return (
    <Tabs defaultActiveKey="master-resellers" id="user-management-tabs" className="mb-3">
      <Tab eventKey="master-resellers" title="Master Resellers">
        <MasterResellerManager />
      </Tab>
      <Tab eventKey="resellers" title="Resellers">
        <ResellerManager />
      </Tab>
      <Tab eventKey="clients" title="Clients">
        <ClientManager />
      </Tab>
    </Tabs>
  );
};

export default UserManagement;
